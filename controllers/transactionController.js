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
        const { startDate, endDate, namaPelanggan } = req.query;
        let whereClause = { shop_id: req.user.shop_id };

        if (startDate && endDate) {
            whereClause.tanggal = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        if (namaPelanggan && namaPelanggan !== 'Semua') {
            whereClause.nama_pelanggan = namaPelanggan;
        }

        const transactions = await Transaction.findAll({
            where: whereClause,
            include: [{ model: TransactionItem }],
            order: [['tanggal', 'DESC']]
        });
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
