const express = require('express');
const path = require('path');
const router = express.Router();
const { supabase } = require('../utils/supabase');
const walletService = require('../services/walletService');
const transactionService = require('../services/transactionService');
const PaymentService = require('../services/paymentService');

// Initialize payment service
const paymentService = new PaymentService({
  transactionFeePercent: 0.005, // 0.5% fee
  // Other config would come from environment
});

/**
 * Serve transaction interface HTML
 */
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../web/transaction.html'));
});

/**
 * Process a transaction from the web interface
 * This endpoint is called when user confirms transaction in the web UI
 */
router.post('/process', async (req, res) => {
  try {
    const {
      phoneNumber, // Sender's phone number
      amount,      // Amount in USDC
      recipient,   // Recipient identifier (phone, username, etc.)
      pin,         // 4-digit PIN
      senderPhone  // Sender's phone (for verification)
    } = req.body;

    // Validate input
    if (!phoneNumber || !amount || !recipient || !pin || !senderPhone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid PIN format' 
      });
    }

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount must be greater than zero' 
      });
    }

    // Verify sender phone matches
    if (phoneNumber !== senderPhone) {
      return res.status(403).json({ 
        success: false, 
        message: 'Phone number mismatch' 
      });
    }

    // Get sender user info
    const sender = await userService.getUserByPhone(phoneNumber);
    if (!sender) {
      return res.status(404).json({ 
        success: false, 
        message: 'Sender not found' 
      });
    }

    // Verify PIN
    const isValidPin = await userService.verifyPin(phoneNumber, pin);
    if (!isValidPin) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid PIN' 
      });
    }

    // Check balance
    if (sender.balance < parseFloat(amount)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient balance' 
      });
    }

    // Process the payment using our payment service
    const paymentResult = await paymentService.sendPayment(
      phoneNumber, 
      recipient, 
      parseFloat(amount)
    );

    if (!paymentResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: paymentResult.message || 'Payment processing failed' 
      });
    }

    // Return success
    res.json({
      success: true,
      message: 'Transaction processed successfully',
      transactionId: paymentResult.transactionId,
      amount: amount,
      recipient: recipient
    });

  } catch (error) {
    console.error('Transaction processing error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

/**
 * Get transaction status
 */
router.get('/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    // In a real implementation, you'd check the transaction status from database
    // For now, we'll return a mock response
    res.json({
      success: true,
      status: 'confirmed',
      transactionId: transactionId
    });
  } catch (error) {
    console.error('Error getting transaction status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;