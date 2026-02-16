const express = require('express');
const router = express.Router();
const { db } = require('../models');

router.post('/sync', async (req, res) => {
  try {
    const { privyId, email, phone, name, walletAddress, walletType, chainId } = req.body;

    if (!privyId) {
      return res.status(400).json({ error: 'Missing privyId' });
    }

    let user = await db.User.findOne({ where: { privyId } });

    if (user) {
      user.email = email || user.email;
      user.phone = phone || user.phone;
      user.name = name || user.name;
      user.walletAddress = walletAddress || user.walletAddress;
      user.walletType = walletType || user.walletType;
      user.chainId = chainId || user.chainId;
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      user = await db.User.create({
        privyId,
        email,
        phone,
        name,
        walletAddress,
        walletType: walletType || 'embedded',
        chainId,
        lastLoginAt: new Date(),
      });
    }

    res.json({
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      walletAddress: user.walletAddress,
      walletType: user.walletType,
    });
  } catch (error) {
    console.error('Sync user error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db.User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      walletAddress: user.walletAddress,
      walletType: user.walletType,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/wallet/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const user = await db.User.findOne({ where: { walletAddress } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      walletAddress: user.walletAddress,
    });
  } catch (error) {
    console.error('Get user by wallet error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
