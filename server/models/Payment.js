const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    paymentId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    senderAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    senderEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    recipientEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    recipientWallet: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tokenAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tokenSymbol: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    secretHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    memo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expiry: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'claimed', 'refunded', 'expired'),
      defaultValue: 'pending',
    },
    transactionHash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    claimTransactionHash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    claimedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  });

  Payment.associate = (models) => {
    Payment.belongsTo(models.User, { as: 'sender', foreignKey: 'senderUserId' });
    Payment.belongsTo(models.User, { as: 'recipient', foreignKey: 'recipientUserId' });
  };

  return Payment;
};
