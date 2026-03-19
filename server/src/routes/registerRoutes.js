const express = require('express');
const path = require('path');
const router = express.Router();
const { supabase } = require('../utils/supabase');
const userService = require('../services/userService');
const walletService = require('../services/walletService');
const { hashPin } = require('../../../src/utils/wallet');

/**
 * Serve registration interface HTML
 */
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../web/registration.html'));
});

/**
 * Complete registration from the web interface
 * This endpoint is called when user submits registration form in the web UI
 */
router.post('/complete', async (req, res) => {
  try {
    const {
      phoneNumber, // User's phone number
      name,        // Optional name
      pin          // 4-digit PIN
    } = req.body;

    // Validate input
    if (!phoneNumber || !pin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: phoneNumber and pin' 
      });
    }

    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid PIN format' 
      });
    }

    // Check if user already exists using the service
    const existingUser = await userService.getUserByPhone(phoneNumber);
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'User already registered' 
      });
    }

    // Generate wallet using the service
    const { address, privateKey } = walletService.generateWallet();

    // Hash PIN using the utility function
    const hashedPin = hashPin(pin);

    // Create user in database using the user service
    const user = await userService.registerUser({
      phone: phoneNumber,
      name: name || null,
      pin: hashedPin // Pass hashed PIN
    });

    // Return success
    res.json({
      success: true,
      message: 'Registration completed successfully',
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        walletAddress: user.walletAddress
      }
    });

  } catch (error) {
    console.error('Registration processing error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    });
  }
});

module.exports = router;