const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tanggal: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  pelanggan_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  nama_pelanggan: {
    type: DataTypes.STRING,
    allowNull: true
  },
  total_bayar: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  bayar: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  kembalian: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  shop_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Shops',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users',
      key: 'id'
    },
    allowNull: true // Allow null for legacy data
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = Transaction;
