const express = require('express');
const router = express.Router();
const escrowService = require('../services/escrowService');
const { db } = require('../models');

router.post('/create', async (req, res) => {
  try {
    const {
      senderAddress,
      senderEmail,
      recipientEmail,
      tokenAddress,
      tokenSymbol,
      amount,
      secret,
      memo,
      expiryDays,
      privateKey,
    } = req.body;

    if (!senderAddress || !tokenAddress || !amount || !secret || !privateKey) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await escrowService.createPayment({
      senderAddress,
      senderEmail,
      recipientEmail,
      tokenAddress,
      tokenSymbol: tokenSymbol || 'USDC',
      amount,
      secret,
      memo,
      expiryDays,
      privateKey,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await escrowService.getPayment(id);
    res.json(payment);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(404).json({ error: error.message });
  }
});

router.post('/:id/claim', async (req, res) => {
  try {
    const { id } = req.params;
    const { secret, recipientAddress, recipientWallet, transactionHash } = req.body;

    if (!secret || !recipientAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await escrowService.claimPayment({
      paymentId: id,
      secret,
      recipientAddress,
      recipientWallet,
      transactionHash,
    });

    res.json(result);
  } catch (error) {
    console.error('Claim payment error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/user/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const payments = await escrowService.getUserPayments(walletAddress);
    res.json(payments);
  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/token/:tokenAddress/balance/:walletAddress', async (req, res) => {
  try {
    const { tokenAddress, walletAddress } = req.params;
    const balance = await escrowService.getTokenBalance(tokenAddress, walletAddress);
    res.json({ balance });
  } catch (error) {
    console.error('Get token balance error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/token/:tokenAddress/allowance/:ownerAddress', async (req, res) => {
  try {
    const { tokenAddress, ownerAddress } = req.params;
    const allowance = await escrowService.getAllowance(tokenAddress, ownerAddress);
    res.json({ allowance });
  } catch (error) {
    console.error('Get allowance error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
