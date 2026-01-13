const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TransactionItem = sequelize.define('TransactionItem', {
  qty: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  harga: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  subtotal: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  transaction_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Transactions',
      key: 'id'
    }
  },
  product_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Products',
      key: 'id'
    }
  },
  nama_barang: { // Snapshot of name in case product is deleted/renamed
    type: DataTypes.STRING 
  }
});

module.exports = TransactionItem;
