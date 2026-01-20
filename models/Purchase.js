const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Purchase = sequelize.define('Purchase', {
  tanggal: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  supplier: {
    type: DataTypes.STRING,
    allowNull: true
  },
  total_biaya: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  keterangan: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  shop_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Shops',
      key: 'id'
    }
  }
});

module.exports = Purchase;
