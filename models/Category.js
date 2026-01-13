const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Category = sequelize.define("Category", {
  nama: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  shop_id: {
    type: DataTypes.INTEGER,
    references: {
      model: "Shops",
      key: "id",
    },
  },
});

module.exports = Category;
