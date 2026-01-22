const Product = require('../models/Product');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const TransactionItem = require('../models/TransactionItem');
const { Op } = require('sequelize');

exports.getDeltaSync = async (req, res) => {
    try {
        const { lastSyncTime } = req.query;
        const shop_id = req.user.shop_id;

        // Convert lastSyncTime to Date object or default to epoch
        const syncTime = lastSyncTime ? new Date(lastSyncTime) : new Date(0);

        // 1. Fetch Categories
        const categories = await Category.findAll({
            where: {
                shop_id,
                updatedAt: { [Op.gt]: syncTime }
            }
        });

        // 2. Fetch Products
        const products = await Product.findAll({
            where: {
                shop_id,
                updatedAt: { [Op.gt]: syncTime }
            }
        });

        // 3. Fetch Transactions (Delta only)
        const transactions = await Transaction.findAll({
            where: {
                shop_id,
                updatedAt: { [Op.gt]: syncTime }
            },
            include: [{ model: TransactionItem }]
        });

        // Current Server Time (important for next sync)
        const serverTime = new Date();

        res.json({
            serverTime,
            categories,
            products,
            transactions
        });
    } catch (error) {
        console.error("Sync Error:", error);
        res.status(500).json({ error: error.message });
    }
};
