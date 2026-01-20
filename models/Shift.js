const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Shift = sequelize.define('Shift', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  shopId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  startTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  initialCash: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  finalCash: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  expectedCash: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('open', 'closed'),
    defaultValue: 'open'
  }
});

module.exports = Shift;
