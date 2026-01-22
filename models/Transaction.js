const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Transaction = sequelize.define('Transaction', {
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
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = Transaction;
