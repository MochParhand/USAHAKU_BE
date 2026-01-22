const Transaction = require('../models/Transaction');
const TransactionItem = require('../models/TransactionItem');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Shift = require('../models/Shift');
const User = require('../models/User');
const { Op } = require('sequelize');
const sequelize = require('../config/db');

exports.getSummary = async (req, res) => {
    try {
        const shop_id = req.user.shop_id;
        const { startTime } = req.query; // Accept startTime from query

        let startDate;
        if (startTime) {
            startDate = new Date(startTime);
        } else {
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
        }

        console.log(`[DEBUG] getSummary shopId=${shop_id} input=${startTime} parsedDate=${startDate.toISOString()} local=${startDate.toString()}`);

        // 1. Total Sales
        const salesToday = await Transaction.sum('total_bayar', {
            where: {
                shop_id,
                tanggal: { [Op.gte]: startDate }
            }
        });

        // 2. Transaction Count Today
        const trxCountToday = await Transaction.count({
            where: {
                shop_id,
                tanggal: { [Op.gte]: startDate }
            }
        });

        // 3. Gross Profit Today
        const profitQuery = `
            SELECT 
                COALESCE(SUM(ti."subtotal" - (ti."qty" * p."harga_dasar")), 0) as "totalProfit"
            FROM "TransactionItems" ti
            JOIN "Transactions" t ON ti."transaction_id" = t."id"
            JOIN "Products" p ON ti."product_id" = p."id"
            WHERE t."shop_id" = :shop_id 
              AND t."tanggal" >= :startDate
        `;

        const profitResult = await sequelize.query(profitQuery, {
            replacements: { shop_id, startDate },
            type: sequelize.QueryTypes.SELECT
        });

        const profitToday = profitResult[0].totalProfit || 0;

        res.json({
            salesToday: salesToday || 0,
            trxCountToday: trxCountToday || 0,
            profitToday: parseInt(profitToday)
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
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            whereClause.tanggal = {
                [Op.between]: [new Date(startDate), end]
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

exports.getProductSalesAnalysis = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const shop_id = req.user.shop_id;

        // 1. Get Real Summary from Transactions
        // Using plain QueryTypes.SELECT for safety/simplicity
        let dateCondition = "";
        const replacements = { shop_id };

        if (startDate && endDate) {
            dateCondition = 'AND "tanggal" BETWEEN :startDate AND :endDate';
            replacements.startDate = new Date(startDate);

            // Fix: Set endDate to the END of the day (23:59:59.999)
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            replacements.endDate = end;
        }

        const summaryQuery = `
            SELECT 
                COUNT("id") as "total_transactions", 
                COALESCE(SUM("total_bayar"), 0) as "total_revenue"
            FROM "Transactions"
            WHERE "shop_id" = :shop_id ${dateCondition}
        `;

        const summaryResult = await sequelize.query(summaryQuery, {
            replacements,
            type: sequelize.QueryTypes.SELECT
        });
        const summary = summaryResult[0];


        // 2. Fetch Product Sales Breakdown (Raw SQL)
        // Adjust table names if your DB uses different casing/pluralization. 
        // Sequelize default: 'Transactions', 'TransactionItems', 'Products', 'Categories'
        // 2. Fetch Product Sales Breakdown (Raw SQL)
        const itemsQuery = `
            SELECT 
                ti."product_id" as "productId", 
                p."barcode", 
                ti."nama_barang" as "productName", 
                c."nama" as "categoryName",
                COALESCE(SUM(ti."qty"), 0) as "totalQty", 
                COALESCE(SUM(ti."subtotal"), 0) as "totalRevenue"
            FROM "TransactionItems" ti
            JOIN "Transactions" t ON ti."transaction_id" = t."id"
            LEFT JOIN "Products" p ON ti."product_id" = p."id"
            LEFT JOIN "Categories" c ON p."kategori_id" = c."id"
            WHERE t."shop_id" = :shop_id ${dateCondition.replace(/"tanggal"/g, 't."tanggal"')}
            GROUP BY ti."product_id", p."barcode", ti."nama_barang", c."nama"
            ORDER BY "totalQty" DESC
        `;

        const items = await sequelize.query(itemsQuery, {
            replacements,
            type: sequelize.QueryTypes.SELECT
        });

        // 3. Calculate total items sold purely from this breakdown
        // Note: items returned by raw query are plain objects, not Sequelize instances
        const totalItemsSold = items.reduce((sum, item) => sum + parseInt(item.totalQty), 0);

        // Raw query returns numbers as strings sometimes in PG, ensure parsing
        const formattedData = items.map(item => ({
            productId: item.productId,
            barcode: item.barcode,
            productName: item.productName,
            categoryName: item.categoryName || 'Tanpa Kategori',
            totalQty: parseInt(item.totalQty),
            totalRevenue: parseInt(item.totalRevenue)
        }));

        res.json({
            summary: {
                totalRevenue: parseInt(summary.total_revenue),
                totalTransactions: parseInt(summary.total_transactions),
                totalItemsSold: totalItemsSold
            },
            data: formattedData
        });

    } catch (error) {
        console.error("Sales Analysis Error:", error);
        res.status(500).json({ error: "Gagal memuat analisis penjualan" });
    }
};

exports.getCustomerSalesAnalysis = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const shop_id = req.user.shop_id;

        let dateCondition = "";
        const replacements = { shop_id };

        if (startDate && endDate) {
            dateCondition = 'AND t."tanggal" BETWEEN :startDate AND :endDate';
            replacements.startDate = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            replacements.endDate = end;
        }

        const query = `
            SELECT 
                t."nama_pelanggan" as "name",
                COUNT(DISTINCT t."id") as "trxCount",
                SUM(t."total_bayar") as "totalSpend",
                SUM(ti."subtotal" - (ti."qty" * p."harga_dasar")) as "totalProfit"
            FROM "Transactions" t
            JOIN "TransactionItems" ti ON t."id" = ti."transaction_id"
            JOIN "Products" p ON ti."product_id" = p."id"
            WHERE t."shop_id" = :shop_id 
            ${dateCondition}
            AND t."nama_pelanggan" IS NOT NULL
            GROUP BY t."nama_pelanggan"
            ORDER BY "totalSpend" DESC
            LIMIT 20
        `;

        const customers = await sequelize.query(query, {
            replacements,
            type: sequelize.QueryTypes.SELECT
        });

        const formattedData = customers.map(c => ({
            name: c.name || 'Umum',
            trxCount: parseInt(c.trxCount || 0),
            totalSpend: parseFloat(c.totalSpend || 0),
            totalProfit: parseFloat(c.totalProfit || 0)
        }));

        res.json({ data: formattedData });

    } catch (error) {
        console.error("Customer Analysis Error:", error);
        res.status(500).json({ error: "Gagal memuat analisis pelanggan" });
    }
};

exports.getInventoryAnalysis = async (req, res) => {
    try {
        const shop_id = req.user.shop_id;

        // Calculate Total Asset Value (Cost vs Sales Price) based on current stock
        const result = await sequelize.query(`
            SELECT 
                COALESCE(SUM("stok" * "harga_dasar"), 0) as "total_cost_value",
                COALESCE(SUM("stok" * "harga"), 0) as "total_sales_value",
                COUNT("id") as "total_products",
                COALESCE(SUM("stok"), 0) as "total_stock_count"
            FROM "Products"
            WHERE "shop_id" = :shop_id 
            AND "is_deleted" = false
        `, {
            replacements: { shop_id },
            type: sequelize.QueryTypes.SELECT
        });

        const data = result[0];

        res.json({
            totalCostValue: parseInt(data.total_cost_value),
            totalSalesValue: parseInt(data.total_sales_value),
            potentialProfit: parseInt(data.total_sales_value) - parseInt(data.total_cost_value),
            totalProducts: parseInt(data.total_products),
            totalStock: parseInt(data.total_stock_count)
        });

    } catch (error) {
        console.error("Inventory Analysis Error:", error);
        res.status(500).json({ error: "Gagal memuat laporan stok." });
    }
};

exports.getProfitLossAnalysis = async (req, res) => {
    try {
        const shop_id = req.user.shop_id;
        const { startDate, endDate } = req.query;

        let dateCondition = "";
        const replacements = { shop_id };

        if (startDate && endDate) {
            dateCondition = 'AND t."tanggal" BETWEEN :startDate AND :endDate';
            replacements.startDate = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            replacements.endDate = end;
        }

        // 1. Calculate Revenue and COGS
        // Revenue: Sum of Transaction.total_bayar (Matches Dashboard)
        // COGS: Sum of (Item Qty * Product Base Price)
        const profitQuery = `
            SELECT 
                (
                    SELECT COALESCE(SUM("total_bayar"), 0)
                    FROM "Transactions" t_sub
                    WHERE t_sub."shop_id" = :shop_id ${dateCondition.replace(/t\./g, 't_sub.')}
                ) as "totalRevenue",
                COALESCE(SUM(ti."qty" * p."harga_dasar"), 0) as "totalCOGS"
            FROM "TransactionItems" ti
            JOIN "Transactions" t ON ti."transaction_id" = t."id"
            JOIN "Products" p ON ti."product_id" = p."id"
            WHERE t."shop_id" = :shop_id ${dateCondition}
        `;

        const result = await sequelize.query(profitQuery, {
            replacements,
            type: sequelize.QueryTypes.SELECT
        });

        const data = result[0];
        const totalRevenue = parseFloat(data.totalRevenue);
        const totalCOGS = parseFloat(data.totalCOGS);
        const grossProfit = totalRevenue - totalCOGS;

        // 2. Expenses (Assuming 'Expense' table exists or returning 0 if not yet implemented)
        // For now, we will assume 0 expenses until Expense module is built.
        const totalExpenses = 0;

        // 3. Net Profit
        const netProfit = grossProfit - totalExpenses;

        res.json({
            totalRevenue,
            totalCOGS,
            grossProfit,
            totalExpenses,
            netProfit,
            margin: totalRevenue === 0 ? 0 : (netProfit / totalRevenue) * 100
        });

    } catch (error) {
        console.error("Profit Loss Analysis Error:", error);
        res.status(500).json({ error: "Gagal memuat analisis laba rugi." });
    }
};

exports.getShiftReports = async (req, res) => {
    try {
        const shop_id = req.user.shop_id;
        const { startDate, endDate } = req.query;

        // Default: Last 7 days
        let start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 7));
        let end = endDate ? new Date(endDate) : new Date();

        // Adjust end date to end of day
        end.setHours(23, 59, 59, 999);

        const shifts = await Shift.findAll({
            where: {
                shopId: shop_id,
                status: 'closed', // Only closed shifts
                startTime: {
                    [Op.between]: [start, end]
                }
            },
            include: [{
                model: User,
                attributes: ['nama', 'role'] // Include cashier name
            }],
            order: [['startTime', 'DESC']]
        });

        const reportData = shifts.map(shift => {
            const initial = parseFloat(shift.initialCash);
            const final = parseFloat(shift.finalCash);
            const expected = parseFloat(shift.expectedCash);
            const sales = expected - initial; // Or use actual sales if stored differently
            const variance = final - expected;

            return {
                id: shift.id,
                employeeName: shift.User ? shift.User.nama : 'Unknown',
                startTime: shift.startTime,
                endTime: shift.endTime,
                initialCash: initial,
                finalCash: final,
                expectedCash: expected,
                totalSales: sales,
                variance: variance,
                status: shift.status
            };
        });

        res.json(reportData);
    } catch (error) {
        console.error("Error getting shift reports:", error);
        res.status(500).json({ error: "Gagal memuat laporan shift." });
    }
};
