/**
 * WhatsApp UI Helper - Provides interactive UI elements for Baileys
 * 
 * This module provides functions for:
 * - Sending interactive buttons (native WhatsApp)
 * - Sending list messages (native WhatsApp)
 * - Confirmation dialogs for sensitive actions
 * - Formatted messages with rich UI
 */

const { Buttons, List } = require('@whiskeysockets/baileys');

/**
 * Send a message with native WhatsApp reply buttons
 * Note: Maximum 3 buttons per message
 * 
 * @param {Object} sock - Baileys socket
 * @param {string} chatId - Chat ID to send to
 * @param {string} text - Main message text
 * @param {Array} buttons - Array of button options [{id, body}]
 * @param {string} title - Optional title
 * @param {string} footer - Optional footer
 * @returns {Promise<void>}
 */
async function sendReplyButtons(sock, chatId, text, buttons, title = null, footer = null) {
    try {
        const buttonParams = buttons.slice(0, 3).map(btn => ({
            buttonId: btn.id || btn.buttonId,
            buttonText: { displayText: btn.body || btn.buttonText?.displayText || btn.text },
            type: 1
        }));

        const message = {
            text,
            footer: footer,
            templateButtons: buttonParams,
            title: title
        };

        await sock.sendMessage(chatId, message);
    } catch (error) {
        console.error('Error sending reply buttons:', error);
        // Fallback to plain text
        await sock.sendMessage(chatId, { text });
    }
}

/**
 * Send a WhatsApp list message
 * Note: Can have up to 10 options
 * 
 * @param {Object} sock - Baileys socket
 * @param {string} chatId - Chat ID to send to
 * @param {string} text - Main message text
 * @param {Array} rows - Array of row options [{id, title, description}]
 * @param {string} buttonText - Text for the button that shows the list
 * @param {string} title - Optional title
 * @param {string} footer - Optional footer
 * @returns {Promise<void>}
 */
async function sendListMessage(sock, chatId, text, rows, buttonText = 'Select an option', title = null, footer = null) {
    try {
        const sections = [
            {
                title: title || 'Options',
                rows: rows.slice(0, 10).map(row => ({
                    title: row.title,
                    description: row.description || '',
                    rowId: row.id
                }))
            }
        ];

        const message = {
            text,
            footer: footer,
            sections: sections,
            buttonText: { displayText: buttonText }
        };

        await sock.sendMessage(chatId, message);
    } catch (error) {
        console.error('Error sending list message:', error);
        // Fallback to plain text
        await sock.sendMessage(chatId, { text });
    }
}

/**
 * Send a confirmation dialog with buttons for sensitive actions
 * 
 * @param {Object} sock - Baileys socket
 * @param {string} chatId - Chat ID
 * @param {string} action - Action being confirmed
 * @param {string} details - Details of the action
 * @returns {Promise<void>}
 */
async function sendConfirmationButtons(sock, chatId, action, details) {
    const text = `⚠️ *Confirm ${action}*\n\n${details}\n\n` +
        `Reply with:\n` +
        `• "confirm" to proceed\n` +
        `• "cancel" to cancel`;
    
    await sock.sendMessage(chatId, { text });
}

/**
 * Send a transaction confirmation with buttons
 * 
 * @param {Object} sock - Baileys socket
 * @param {string} chatId - Chat ID
 * @param {Object} transferDetails - {amount, recipient, fee, total}
 */
async function sendTransferConfirmation(sock, chatId, transferDetails) {
    const { amount, recipient, fee, total } = transferDetails;
    
    const text = `💸 *Confirm Transfer*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📤 To: ${recipient}\n` +
        `💰 Amount: *$${amount} USDC*\n` +
        `📝 Fee: $${fee} USDC\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `💵 Total: *$${total} USDC*\n\n` +
        `🔐 *SECURITY NOTICE*\n` +
        `This transaction requires your PIN for authorization.\n\n` +
        `📝 To confirm, reply with:\n` +
        `confirm [your 4-digit PIN]\n\n` +
        `Example: confirm 1234\n\n` +
        `⏰ This request expires in 10 minutes\n` +
        `❌ To cancel, reply: cancel`;
    
    await sock.sendMessage(chatId, { text });
}

/**
 * Send main menu with buttons
 * 
 * @param {Object} sock - Baileys socket
 * @param {string} chatId - Chat ID
 * @param {boolean} isRegistered - Whether user has a wallet
 */
async function sendMainMenuButtons(sock, chatId, isRegistered) {
    if (isRegistered) {
        const text = `📱 *Peys Menu*\n\n` +
            `Choose an action:\n\n` +
            `1. 💸 Send USDC\n` +
            `2. 💰 Balance\n` +
            `3. 📜 History\n` +
            `4. ⛽ ETH Balance\n` +
            `5. 💧 Get ETH (Faucet)\n\n` +
            `Reply with a number or command.\n\n` +
            `Commands: send, balance, eth, faucet, history, address`;
        
        await sock.sendMessage(chatId, { text });
    } else {
        const text = `📱 *Welcome to Peys*\n\n` +
            `Send & receive USDC via WhatsApp!\n\n` +
            `1. 📝 Register\n` +
            `2. ❓ Learn More\n\n` +
            `Reply with a number or command.\n\n` +
            `To register: register [PIN]\n` +
            `Example: register 1234`;
        
        await sock.sendMessage(chatId, { text });
    }
}

/**
 * Send a list for selecting options
 * 
 * @param {Object} sock - Baileys socket
 * @param {string} chatId - Chat ID
 * @param {string} title - List title
 * @param {Array} options - [{id, title, description}]
 */
async function sendOptionList(sock, chatId, title, options) {
    const rows = options.map(opt => ({
        id: opt.id,
        title: opt.title,
        description: opt.description || ''
    }));
    
    await sendListMessage(
        sock,
        chatId,
        `📋 *${title}*\n\nSelect an option:`,
        rows,
        'View Options'
    );
}

/**
 * Send balance as a rich card (text format)
 * 
 * @param {Object} sock - Baileys socket
 * @param {string} chatId - Chat ID
 * @param {string} balance - Balance amount
 * @param {string} walletAddress - Wallet address
 */
async function sendBalanceCard(sock, chatId, balance, walletAddress) {
    const text = `💰 *Your Balance*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `*$${balance} USDC*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📍 *Wallet:*\n` +
        `${walletAddress}\n\n` +
        `_Tap address to copy_`;
    
    await sock.sendMessage(chatId, { text });
}

/**
 * Send PIN entry request
 * 
 * @param {Object} sock - Baileys socket
 * @param {string} chatId - Chat ID
 * @param {string} purpose - What the PIN is for
 */
async function requestPinEntry(sock, chatId, purpose) {
    const text = `🔐 *PIN Required*\n\n` +
        `Enter your 4-digit PIN to ${purpose}\n\n` +
        `_Your PIN is never shared_`;
    
    await sock.sendMessage(chatId, { text });
}

/**
 * Send success message
 * 
 * @param {Object} sock - Baileys socket
 * @param {string} chatId - Chat ID
 * @param {string} title - Success title
 * @param {string} message - Success message
 */
async function sendSuccess(sock, chatId, title, message) {
    const text = `✅ *${title}*\n\n${message}`;
    await sock.sendMessage(chatId, { text });
}

/**
 * Send error message
 * 
 * @param {Object} sock - Baileys socket
 * @param {string} chatId - Chat ID
 * @param {string} title - Error title
 * @param {string} message - Error message
 */
async function sendError(sock, chatId, title, message) {
    const text = `❌ *${title}*\n\n${message}`;
    await sock.sendMessage(chatId, { text });
}

/**
 * Send transaction receipt
 * 
 * @param {Object} sock - Baileys socket
 * @param {string} chatId - Chat ID
 * @param {Object} transaction - Transaction details
 * @param {string} type - 'sent' or 'received'
 */
async function sendReceipt(sock, chatId, transaction, type) {
    const emoji = type === 'sent' ? '📤' : '📥';
    const title = type === 'sent' ? 'Payment Sent' : 'Payment Received';
    const status = transaction.status === 'confirmed' ? '✅ Confirmed' : '⏳ Pending';
    
    const text = `${emoji} *${title}*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `💰 *$${transaction.amount} USDC*\n` +
        `📊 Status: ${status}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🕐 ${new Date(transaction.createdAt).toLocaleString()}`;
    
    if (transaction.txHash) {
        text += `\n\n🔗 Tx: ${transaction.txHash.substring(0, 20)}...`;
    }
    
    await sock.sendMessage(chatId, { text });
}

/**
 * Send interactive message with buttons (new Baileys format)
 * 
 * @param {Object} sock - Baileys socket
 * @param {string} chatId - Chat ID
 * @param {string} text - Message text
 * @param {Array} buttons - [{id, text}] array
 */
async function sendInteractiveButtons(sock, chatId, text, buttons) {
    try {
        const templateButtons = buttons.slice(0, 3).map(btn => ({
            buttonId: btn.id,
            buttonText: { displayText: btn.text },
            type: 1
        }));

        await sock.sendMessage(chatId, {
            text,
            templateButtons,
            viewOnce: false
        });
    } catch (error) {
        console.error('Error sending interactive buttons:', error);
        // Fallback to plain text
        await sock.sendMessage(chatId, { text });
    }
}

/**
 * Send a message with a CTA URL button
 * 
 * @param {Object} sock - Baileys socket
 * @param {string} chatId - Chat ID
 * @param {string} text - Message text
 * @param {string} url - URL to open
 * @param {string} buttonText - Button text
 */
async function sendCTAUrl(sock, chatId, text, url, buttonText) {
    try {
        await sock.sendMessage(chatId, {
            text,
            templateButtons: [
                {
                    urlButton: {
                        displayText: buttonText,
                        url: url
                    }
                }
            ]
        });
    } catch (error) {
        console.error('Error sending CTA URL:', error);
        // Fallback to plain text with URL
        try {
            await sock.sendMessage(chatId, { text: `${text}\n\n🔗 Open: ${url}` });
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
        }
    }
}

module.exports = {
    sendReplyButtons,
    sendListMessage,
    sendConfirmationButtons,
    sendTransferConfirmation,
    sendMainMenuButtons,
    sendOptionList,
    sendBalanceCard,
    requestPinEntry,
    sendSuccess,
    sendError,
    sendReceipt,
    sendInteractiveButtons,
    sendCTAUrl
};
