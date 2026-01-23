const Transaction = require('../models/Transaction');
const TransactionItem = require('../models/TransactionItem');
const Product = require('../models/Product');
const sequelize = require('../config/db');
const { Op } = require('sequelize');
const { v5: uuidv5, validate: uuidValidate } = require('uuid');

// Namespace for generating deterministic UUIDs from legacy IDs
const LEGACY_ID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

exports.createTransaction = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id, tanggal, items, total_bayar, bayar, kembalian, pelanggan_id, nama_pelanggan } = req.body;
        const shop_id = req.user.shop_id;

        // 1. Create Transaction Header
        // Accept client-generated UUID for offline-first support
        const transactionData = {
            shop_id,
            total_bayar,
            bayar,
            kembalian,
            pelanggan_id,
            nama_pelanggan,
            user_id: req.user.id // Track who created the transaction
        };

        // Accept tanggal from client (for offline transactions)
        if (tanggal) {
            transactionData.tanggal = new Date(tanggal);
        }


        // Handle ID from client (support both UUID and legacy integer IDs)
        if (id && id !== "undefined") {
            if (uuidValidate(id)) {
                // Valid UUID, use as-is
                transactionData.id = id;
            } else if (!isNaN(parseInt(id))) {
                // Legacy integer ID - generate deterministic UUID
                transactionData.id = uuidv5(id.toString(), LEGACY_ID_NAMESPACE);
                console.log(`[UUID Conversion] Legacy ID ${id} -> UUID ${transactionData.id}`);
            }
            // If it's a string like "LOC-...", we skip setting the ID and let Sequelize 
            // generate a fresh UUID, OR we could uuidv5 it too.
            else {
                transactionData.id = uuidv5(id.toString(), LEGACY_ID_NAMESPACE);
            }
        }
        // If no ID provided, PostgreSQL will auto-generate UUID

        const newTransaction = await Transaction.create(transactionData, { transaction: t });

        // 2. Process Items
        for (const item of items) {
            const product_id = parseInt(item.barangId);

            if (isNaN(product_id)) {
                console.warn(`[Transaction] Skipping item with invalid product_id: ${item.barangId}`);
                continue;
            }

            // Deduct Stock
            const product = await Product.findOne({ where: { id: product_id, shop_id }, transaction: t });
            if (!product) {
                throw new Error(`Product ID ${product_id} not found`);
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
                product_id: product_id,
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
        console.error('[Transaction Create Error]', {
            message: error.message,
            name: error.name,
            errors: error.errors, // For Sequelize validation errors
            stack: error.stack,
            requestBody: req.body,
            user: req.user
        });
        res.status(500).json({
            error: error.message,
            details: error.errors ? error.errors.map(e => e.message) : null
        });
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
