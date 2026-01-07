const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  nama: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('owner', 'kasir'), defaultValue: 'kasir' },
  shop_id: {
    type: DataTypes.INTEGER,
    references: { model: 'Shops', key: 'id' }
  }
});

module.exports = User;