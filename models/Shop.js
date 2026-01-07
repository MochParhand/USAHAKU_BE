const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Shop = sequelize.define('Shop', {
  nama_toko: { type: DataTypes.STRING, allowNull: false },
  alamat: { type: DataTypes.TEXT }
});

module.exports = Shop;