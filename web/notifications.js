/**
 * Peys WhatsApp Notifications Service
 * Sends WhatsApp notifications for web actions
 */

class WhatsAppNotifications {
  constructor() {
    this.apiUrl = '/api/notifications';
  }

  async send(data) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Notification error:', error);
      return { success: false, error: error.message };
    }
  }

  async registrationSuccess(phone, name) {
    return this.send({
      type: 'registration',
      phone,
      message: `Welcome to Peys, ${name}! 🎉\n\nYour account is ready. Start by sending "send" followed by amount and recipient to send USDC.`,
      metadata: { name }
    });
  }

  async transactionSent(phone, amount, recipient, txHash) {
    return this.send({
      type: 'transaction_sent',
      phone,
      message: `✅ Sent ${amount} USDC\nTo: ${recipient}\n\nTx: ${txHash ? `${txHash.slice(0, 10)}...` : 'Pending'}`,
      metadata: { amount, recipient, txHash }
    });
  }

  async transactionReceived(phone, amount, sender, txHash) {
    return this.send({
      type: 'transaction_received',
      phone,
      message: `💰 Received ${amount} USDC\nFrom: ${sender}\n\nTx: ${txHash ? `${txHash.slice(0, 10)}...` : 'Pending'}`,
      metadata: { amount, sender, txHash }
    });
  }

  async claimSuccess(phone, amount, claimCode) {
    return this.send({
      type: 'claim_success',
      phone,
      message: `🎁 Claimed ${amount} USDC!\nCode: ${claimCode}\n\nFunds added to your wallet.`,
      metadata: { amount, claimCode }
    });
  }

  async claimFailed(phone, reason) {
    return this.send({
      type: 'claim_failed',
      phone,
      message: `❌ Claim failed\n\n${reason}\n\nContact support if you need help.`,
      metadata: { reason }
    });
  }

  async faucetSuccess(phone, amount, txHash) {
    return this.send({
      type: 'faucet_success',
      phone,
      message: `🚰 Got ${amount} ETH!\n\nTest ETH added to your wallet. Tx: ${txHash ? `${txHash.slice(0, 10)}...` : 'Pending'}`,
      metadata: { amount, txHash }
    });
  }

  async faucetFailed(phone, reason) {
    return this.send({
      type: 'faucet_failed',
      phone,
      message: `⚠️ Faucet request failed\n\n${reason}\n\nPlease try again later.`,
      metadata: { reason }
    });
  }

  async pendingClaimReminder(phone, claims) {
    if (!claims || claims.length === 0) return;
    
    const claimList = claims.map(c => `• ${c.amount} USDC (Code: ${c.claim_code})`).join('\n');
    return this.send({
      type: 'pending_claims',
      phone,
      message: `📬 You have ${claims.length} pending claim(s):\n\n${claimList}\n\nVisit your dashboard to claim them!`,
      metadata: { claims }
    });
  }

  async errorAlert(phone, action, error) {
    return this.send({
      type: 'error',
      phone,
      message: `❌ ${action} failed\n\n${error}\n\nPlease try again or contact support.`,
      metadata: { action, error }
    });
  }

  async securityAlert(phone, alertType, details) {
    return this.send({
      type: 'security',
      phone,
      message: `🔐 Security Alert\n\n${alertType}\n\n${details}\n\nIf this wasn't you, contact support immediately.`,
      metadata: { alertType, details }
    });
  }
}

const whatsappNotifications = new WhatsAppNotifications();

// Helper functions for pages
async function notifyRegistration(phone, name) {
  return whatsappNotifications.registrationSuccess(phone, name);
}

async function notifyTransactionSent(phone, amount, recipient, txHash) {
  return whatsappNotifications.transactionSent(phone, amount, recipient, txHash);
}

async function notifyTransactionReceived(phone, amount, sender, txHash) {
  return whatsappNotifications.transactionReceived(phone, amount, sender, txHash);
}

async function notifyClaimSuccess(phone, amount, claimCode) {
  return whatsappNotifications.claimSuccess(phone, amount, claimCode);
}

async function notifyClaimFailed(phone, reason) {
  return whatsappNotifications.claimFailed(phone, reason);
}

async function notifyFaucetSuccess(phone, amount, txHash) {
  return whatsappNotifications.faucetSuccess(phone, amount, txHash);
}

async function notifyFaucetFailed(phone, reason) {
  return whatsappNotifications.faucetFailed(phone, reason);
}

async function notifyPendingClaims(phone, claims) {
  return whatsappNotifications.pendingClaimReminder(phone, claims);
}

async function notifyError(phone, action, error) {
  return whatsappNotifications.errorAlert(phone, action, error);
}
