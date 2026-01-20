const Transaction = require('../models/Transaction');
const TransactionItem = require('../models/TransactionItem');
const Product = require('../models/Product');
const { Op } = require('sequelize');
const sequelize = require('../config/db');

exports.getSummary = async (req, res) => {
    try {
        const shop_id = req.user.shop_id;
        const today = new Date();
        today.setHours(0,0,0,0);

        // 1. Total Sales Today
        const salesToday = await Transaction.sum('total_bayar', {
            where: {
                shop_id,
                tanggal: { [Op.gte]: today }
            }
        });

        // 2. Transaction Count Today
        const trxCountToday = await Transaction.count({
            where: {
                shop_id,
                tanggal: { [Op.gte]: today }
            }
        });

        // 3. Gross Profit Today (Total Sales - (Item Qty * Base Price))
        // This is complex in SQL, for now let's simplify or do a raw query if needed
        // Simpler approach: Iterate recent transactions or use a raw query.
        // Let's use a raw query for performance on profit calculation
        
        const profitQuery = `
            SELECT SUM(ti.subtotal - (ti.qty * p.harga_dasar)) as profit
            FROM "TransactionItems" ti
            JOIN "Transactions" t ON ti.transaction_id = t.id
            JOIN "Products" p ON ti.product_id = p.id
            WHERE t.shop_id = :shopId AND t.tanggal >= :date
        `;
        // Note: Check if table names are quoted or not in your DB. Sequelize defaults usually pluralize.
        // Assuming standard Sequelize naming. "TransactionItems", "Transactions", "Products".
        
        // Safety check: if standard models are used, we can try to compute nicely.
        // Or for now, return 0 if complicated and refine later.
        
        res.json({
            salesToday: salesToday || 0,
            trxCountToday: trxCountToday || 0,
            profitToday: 0 // Placeholder for now, can implement if Product has base price
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const shop_id = req.user.shop_id;

        const whereClause = { shop_id };
        if (startDate && endDate) {
            whereClause.tanggal = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const transactions = await Transaction.findAll({
            where: whereClause,
            include: [{ model: TransactionItem }],
            order: [['tanggal', 'DESC']]
        });

        const totalSales = transactions.reduce((sum, t) => sum + t.total_bayar, 0);

        res.json({
            totalSales,
            transactionCount: transactions.length,
            data: transactions
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
