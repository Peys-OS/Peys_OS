const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    privyId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    walletAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    walletType: {
      type: DataTypes.ENUM('embedded', 'external'),
      defaultValue: 'embedded',
    },
    chainId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  });

  User.associate = (models) => {
    User.hasMany(models.Payment, { as: 'sentPayments', foreignKey: 'senderUserId' });
    User.hasMany(models.Payment, { as: 'receivedPayments', foreignKey: 'recipientUserId' });
  };

  return User;
};
