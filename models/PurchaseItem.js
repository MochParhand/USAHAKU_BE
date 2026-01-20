const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PurchaseItem = sequelize.define('PurchaseItem', {
  purchase_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Purchases',
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
  jumlah: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  harga_beli: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = PurchaseItem;
