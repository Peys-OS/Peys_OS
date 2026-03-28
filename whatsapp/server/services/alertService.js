/**
 * Alert Service
 * Sends alerts to Slack, Discord, or custom webhooks
 */

class AlertService {
  constructor() {
    this.webhookUrl = process.env.ALERT_WEBHOOK_URL || null;
    this.emailEnabled = process.env.ALERT_EMAIL_ENABLED === 'true';
    this.emailRecipients = (process.env.ALERT_EMAIL_RECIPIENTS || '').split(',').filter(Boolean);
    this.minAlertLevel = process.env.ALERT_MIN_LEVEL || 'info'; // debug, info, warning, error, critical
    this.alertHistory = [];
    this.maxHistory = 100;
    this.cooldownPeriod = parseInt(process.env.ALERT_COOLDOWN_MS) || 300000; // 5 minutes
    this.cooldowns = new Map();
  }

  /**
   * Log levels
   */
  static levels = {
    debug: 0,
    info: 1,
    warning: 2,
    error: 3,
    critical: 4
  };

  /**
   * Check if alert should be sent (cooldown check)
   */
  isOnCooldown(alertType) {
    const lastAlert = this.cooldowns.get(alertType);
    if (lastAlert && Date.now() - lastAlert < this.cooldownPeriod) {
      return true;
    }
    return false;
  }

  /**
   * Set cooldown for an alert type
   */
  setCooldown(alertType) {
    this.cooldowns.set(alertType, Date.now());
  }

  /**
   * Send alert
   */
  async send(level, title, message, data = {}) {
    // Check minimum level
    if (AlertService.levels[level] < AlertService.levels[this.minAlertLevel]) {
      return null;
    }

    const alert = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      title,
      message,
      data,
      sent: false,
      error: null
    };

    // Add to history
    this.addToHistory(alert);

    // Check cooldown
    if (this.isOnCooldown(level)) {
      console.log(`[AlertService] Skipping "${title}" - on cooldown`);
      return null;
    }

    // Send to webhook
    if (this.webhookUrl) {
      try {
        await this.sendWebhook(alert);
        alert.sent = true;
        this.setCooldown(level);
      } catch (error) {
        alert.error = error.message;
        console.error('[AlertService] Webhook failed:', error.message);
      }
    }

    // Log to console
    this.logToConsole(alert);

    return alert;
  }

  /**
   * Generate alert ID
   */
  generateId() {
    return `alert-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Add alert to history
   */
  addToHistory(alert) {
    this.alertHistory.push(alert);
    if (this.alertHistory.length > this.maxHistory) {
      this.alertHistory.shift();
    }
  }

  /**
   * Send to webhook
   */
  async sendWebhook(alert) {
    const payload = {
      text: this.formatSlackMessage(alert),
      attachments: [{
        color: this.getColor(alert.level),
        fields: [
          { title: 'Level', value: alert.level.toUpperCase(), short: true },
          { title: 'Time', value: alert.timestamp, short: true },
          { title: 'Title', value: alert.title }
        ],
        footer: 'Peys WhatsApp Bot',
        ts: Math.floor(Date.now() / 1000)
      }]
    };

    // Add data fields if present
    if (Object.keys(alert.data).length > 0) {
      payload.attachments[0].fields.push({
        title: 'Details',
        value: JSON.stringify(alert.data, null, 2)
      });
    }

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}`);
    }
  }

  /**
   * Format Slack message
   */
  formatSlackMessage(alert) {
    const emoji = this.getEmoji(alert.level);
    return `${emoji} *${alert.title}*\n${alert.message}`;
  }

  /**
   * Get emoji for level
   */
  getEmoji(level) {
    const emojis = {
      debug: '🔍',
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🚨'
    };
    return emojis[level] || '📢';
  }

  /**
   * Get color for level
   */
  getColor(level) {
    const colors = {
      debug: '#808080',
      info: '#2196F3',
      warning: '#FF9800',
      error: '#F44336',
      critical: '#B71C1C'
    };
    return colors[level] || '#607D8B';
  }

  /**
   * Log to console
   */
  logToConsole(alert) {
    const prefix = `[${alert.level.toUpperCase()}]`;
    switch (alert.level) {
      case 'critical':
      case 'error':
        console.error(`${prefix} ${alert.title}: ${alert.message}`);
        break;
      case 'warning':
        console.warn(`${prefix} ${alert.title}: ${alert.message}`);
        break;
      default:
        console.log(`${prefix} ${alert.title}: ${alert.message}`);
    }
  }

  /**
   * Convenience methods
   */
  debug(title, message, data) {
    return this.send('debug', title, message, data);
  }

  info(title, message, data) {
    return this.send('info', title, message, data);
  }

  warning(title, message, data) {
    return this.send('warning', title, message, data);
  }

  error(title, message, data) {
    return this.send('error', title, message, data);
  }

  critical(title, message, data) {
    return this.send('critical', title, message, data);
  }

  /**
   * Get alert history
   */
  getHistory(limit = 50, level = null) {
    let history = this.alertHistory;
    if (level) {
      history = history.filter(h => h.level === level);
    }
    return history.slice(-limit);
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      configured: !!this.webhookUrl,
      minLevel: this.minAlertLevel,
      cooldownPeriod: this.cooldownPeriod,
      historySize: this.alertHistory.length
    };
  }
}

// Export singleton
const alertService = new AlertService();
export default alertService;
