const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Product = sequelize.define('Product', {
  nama: {
    type: DataTypes.STRING,
    allowNull: false
  },
  harga: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  harga_dasar: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  stok: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  min_stok: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  image: {
    type: DataTypes.STRING, // Path to image file
    allowNull: true
  },
  barcode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_jasa: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  kategori_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Categories',
      key: 'id'
    }
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

module.exports = Product;
