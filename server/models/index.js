const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
  }
);

const db = {
  sequelize,
  Sequelize,
  User: require('./User')(sequelize),
  Payment: require('./Payment')(sequelize),
};

db.User.hasMany(db.Payment, { as: 'sentPayments', foreignKey: 'senderUserId' });
db.User.hasMany(db.Payment, { as: 'receivedPayments', foreignKey: 'recipientUserId' });
db.Payment.belongsTo(db.User, { as: 'sender', foreignKey: 'senderUserId' });
db.Payment.belongsTo(db.User, { as: 'recipient', foreignKey: 'recipientUserId' });

module.exports = db;
