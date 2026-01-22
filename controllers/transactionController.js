const Transaction = require('../models/Transaction');
const TransactionItem = require('../models/TransactionItem');
const Product = require('../models/Product');
const sequelize = require('../config/db');
const { Op } = require('sequelize');

exports.createTransaction = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { items, total_bayar, bayar, kembalian, pelanggan_id, nama_pelanggan } = req.body;
        const shop_id = req.user.shop_id;

        // 1. Create Transaction Header
        const newTransaction = await Transaction.create({
            shop_id,
            total_bayar,
            bayar,
            kembalian,
            pelanggan_id,
            nama_pelanggan
        }, { transaction: t });

        // 2. Process Items
        for (const item of items) {
            // Deduct Stock
            const product = await Product.findOne({ where: { id: item.barangId, shop_id }, transaction: t });
            if (!product) {
                throw new Error(`Product ID ${item.barangId} not found`);
            }
            if (product.is_deleted) {
                throw new Error(`Product ${product.nama} has been deleted/archived and cannot be sold`);
            }
            if (product.stok < item.qty) {
                throw new Error(`Stock not sufficient for product ${product.nama}`);
            }

            await product.update({ stok: product.stok - item.qty }, { transaction: t });

            // Create Transaction Item
            await TransactionItem.create({
                transaction_id: newTransaction.id,
                product_id: item.barangId,
                qty: item.qty,
                harga: item.harga,
                subtotal: item.subtotal,
                nama_barang: item.namaBarang
            }, { transaction: t });
        }

        await t.commit();
        res.status(201).json({ message: "Transaction success", transactionId: newTransaction.id });

    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

exports.getTransactions = async (req, res) => {
    try {
        let { startDate, endDate, namaPelanggan, page, limit } = req.query;
        let whereClause = { shop_id: req.user.shop_id };

        // Pagination
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 20; // Smaller limit for history list
        const offset = (page - 1) * limit;

        if (startDate && endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            whereClause.tanggal = {
                [Op.between]: [new Date(startDate), end]
            };
        }

        if (namaPelanggan && namaPelanggan !== 'Semua') {
            whereClause.nama_pelanggan = namaPelanggan;
        }

        const { count, rows: transactions } = await Transaction.findAndCountAll({
            where: whereClause,
            attributes: ['id', 'total_bayar', 'bayar', 'kembalian', 'pelanggan_id', 'nama_pelanggan', 'tanggal'],
            include: [{
                model: TransactionItem,
                attributes: ['id', 'product_id', 'qty', 'harga', 'subtotal', 'nama_barang']
            }],
            limit: limit,
            offset: offset,
            order: [['tanggal', 'DESC']]
        });

        res.set('X-Total-Count', count);
        res.set('X-Total-Pages', Math.ceil(count / limit));
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCustomerNames = async (req, res) => {
    try {
        const customers = await Transaction.findAll({
            where: { shop_id: req.user.shop_id },
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('nama_pelanggan')), 'nama_pelanggan']],
            raw: true
        });
        res.json(customers.map(c => c.nama_pelanggan || "Umum"));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
