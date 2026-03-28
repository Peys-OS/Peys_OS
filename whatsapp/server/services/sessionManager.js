/**
 * WhatsApp Session Manager
 * Handles session persistence, backup, and recovery
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

class SessionManager {
  constructor() {
    this.sessionPath = process.env.WHATSAPP_SESSION_PATH || './.waweb_auth';
    this.backupPath = process.env.WHATSAPP_SESSION_BACKUP_PATH || './.waweb_auth/backup';
    this.backupInterval = parseInt(process.env.SESSION_BACKUP_INTERVAL_MS) || 300000; // 5 minutes
    this.backupIntervalHandle = null;
    this.sessionMeta = {
      lastBackup: null,
      lastRestore: null,
      backupCount: 0
    };
  }

  /**
   * Initialize session manager
   */
  async initialize() {
    // Ensure directories exist
    if (!existsSync(this.sessionPath)) {
      mkdirSync(this.sessionPath, { recursive: true });
    }
    if (!existsSync(this.backupPath)) {
      mkdirSync(this.backupPath, { recursive: true });
    }

    // Load session metadata
    this.loadMeta();

    // Start periodic backup
    this.startPeriodicBackup();

    console.log('[SessionManager] Initialized at:', this.sessionPath);
  }

  /**
   * Load session metadata
   */
  loadMeta() {
    const metaPath = path.join(this.backupPath, 'meta.json');
    try {
      if (existsSync(metaPath)) {
        const data = readFileSync(metaPath, 'utf8');
        this.sessionMeta = JSON.parse(data);
      }
    } catch (e) {
      console.log('[SessionManager] No existing metadata found');
    }
  }

  /**
   * Save session metadata
   */
  saveMeta() {
    const metaPath = path.join(this.backupPath, 'meta.json');
    try {
      writeFileSync(metaPath, JSON.stringify(this.sessionMeta, null, 2));
    } catch (e) {
      console.error('[SessionManager] Failed to save metadata:', e.message);
    }
  }

  /**
   * Get session data path for a client ID
   */
  getSessionDataPath(clientId) {
    return path.join(this.sessionPath, clientId || 'default');
  }

  /**
   * Create a new session ID
   */
  createSessionId() {
    return `peys-bot-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Check if a session exists
   */
  sessionExists(clientId) {
    const sessionDataPath = this.getSessionDataPath(clientId);
    const statePath = path.join(sessionDataPath, 'Local State');
    return existsSync(statePath);
  }

  /**
   * Backup current session
   */
  async backupSession(clientId) {
    try {
      const sessionDataPath = this.getSessionDataPath(clientId);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.backupPath, `session-${timestamp}.json`);

      // Read current session data if exists
      const statePath = path.join(sessionDataPath, 'Local State');
      if (existsSync(statePath)) {
        const stateData = readFileSync(statePath, 'utf8');
        const backupData = {
          timestamp: Date.now(),
          clientId,
          state: JSON.parse(stateData)
        };
        writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
        
        this.sessionMeta.lastBackup = Date.now();
        this.sessionMeta.backupCount++;
        this.saveMeta();

        console.log('[SessionManager] Session backed up:', backupFile);
        return true;
      }
      return false;
    } catch (e) {
      console.error('[SessionManager] Backup failed:', e.message);
      return false;
    }
  }

  /**
   * Restore session from backup
   */
  async restoreSession(clientId) {
    try {
      const sessionDataPath = this.getSessionDataPath(clientId);
      
      // Find most recent backup
      const fs = await import('fs');
      const files = fs.readdirSync(this.backupPath).filter(f => f.startsWith('session-'));
      if (files.length === 0) {
        console.log('[SessionManager] No backup found to restore');
        return false;
      }

      files.sort().reverse();
      const latestBackup = files[0];
      const backupContent = readFileSync(path.join(this.backupPath, latestBackup), 'utf8');
      const backupData = JSON.parse(backupContent);

      // Restore state
      const statePath = path.join(sessionDataPath, 'Local State');
      mkdirSync(sessionDataPath, { recursive: true });
      writeFileSync(statePath, JSON.stringify(backupData.state));

      this.sessionMeta.lastRestore = Date.now();
      this.saveMeta();

      console.log('[SessionManager] Session restored from:', latestBackup);
      return true;
    } catch (e) {
      console.error('[SessionManager] Restore failed:', e.message);
      return false;
    }
  }

  /**
   * Start periodic session backup
   */
  startPeriodicBackup() {
    if (this.backupIntervalHandle) {
      clearInterval(this.backupIntervalHandle);
    }

    this.backupIntervalHandle = setInterval(async () => {
      if (this.sessionExists('default')) {
        await this.backupSession('default');
      }
    }, this.backupInterval);

    console.log('[SessionManager] Periodic backup started (every', this.backupInterval / 1000, 'seconds)');
  }

  /**
   * Stop periodic backup
   */
  stopPeriodicBackup() {
    if (this.backupIntervalHandle) {
      clearInterval(this.backupIntervalHandle);
      this.backupIntervalHandle = null;
    }
  }

  /**
   * Get session status
   */
  getStatus() {
    return {
      ...this.sessionMeta,
      sessionPath: this.sessionPath,
      hasSession: this.sessionExists('default'),
      uptime: process.uptime()
    };
  }

  /**
   * Cleanup old backups (keep last 10)
   */
  async cleanupOldBackups(keepCount = 10) {
    try {
      const fs = await import('fs');
      const files = fs.readdirSync(this.backupPath).filter(f => f.startsWith('session-'));
      files.sort().reverse();
      
      const toDelete = files.slice(keepCount);
      for (const file of toDelete) {
        fs.unlinkSync(path.join(this.backupPath, file));
      }
      
      if (toDelete.length > 0) {
        console.log(`[SessionManager] Cleaned up ${toDelete.length} old backups`);
      }
    } catch (e) {
      console.error('[SessionManager] Cleanup failed:', e.message);
    }
  }
}

// Export singleton instance
const sessionManager = new SessionManager();
export default sessionManager;
