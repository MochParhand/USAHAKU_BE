const Transaction = require('../models/Transaction');
const TransactionItem = require('../models/TransactionItem');
const Product = require('../models/Product');
const sequelize = require('../config/db');
const { Op } = require('sequelize');

/**
 * PENTING: Pastikan Anda menjalankan 'npm install uuid@9.0.1' di terminal.
 * Versi 10 ke atas menggunakan ESM yang akan membuat Vercel Crash.
 */
const { v4: uuidv4, v5: uuidv5, validate: uuidValidate } = require('uuid');

// Namespace unik untuk konversi ID lama ke UUID
const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

exports.createTransaction = async (req, res) => {
    // Database Transaction: Menjamin data konsisten (stok terpotong DAN riwayat tersimpan)
    const t = await sequelize.transaction();

    try {
        const { id, tanggal, items, total_bayar, bayar, kembalian, pelanggan_id, nama_pelanggan } = req.body;
        const shop_id = req.user.shop_id;
        const user_id = req.user.id;

        // 1. Logika Penentuan ID Transaksi (Offline-First Ready)
        let transactionId;
        if (id && id !== "undefined") {
            if (uuidValidate(id)) {
                transactionId = id; // Gunakan UUID dari Flutter
            } else {
                // Konversi ID non-UUID menjadi UUID agar database tidak error
                transactionId = uuidv5(id.toString(), UUID_NAMESPACE);
            }
        } else {
            transactionId = uuidv4(); // Generate baru jika tidak ada ID
        }

        // 2. Persiapan Data Header
        const transactionData = {
            id: transactionId,
            shop_id,
            user_id,
            total_bayar,
            bayar,
            kembalian,
            pelanggan_id,
            nama_pelanggan: nama_pelanggan || "Umum",
            tanggal: tanggal ? new Date(tanggal) : new Date()
        };

        /**
         * Menggunakan UPSERT:
         * Jika ID sudah ada di Cloud (karena sinkronisasi ulang), dia akan UPDATE.
         * Jika ID belum ada, dia akan INSERT. Ini solusi terbaik untuk sinkronisasi manual.
         */
        await Transaction.upsert(transactionData, { transaction: t });

        // 3. Proses Item Transaksi & Update Stok Produk
        for (const item of items) {
            const product_id = parseInt(item.barangId);
            if (isNaN(product_id)) continue;

            // Cari produk dengan LOCK agar stok tidak bentrok (Race Condition)
            const product = await Product.findOne({
                where: { id: product_id, shop_id },
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!product) {
                throw new Error(`Produk dengan ID ${product_id} tidak ditemukan di toko ini.`);
            }

            // Validasi Stok di Server (Double Check)
            if (product.stok < item.qty) {
                throw new Error(`Stok produk '${product.nama}' tidak mencukupi (Tersisa: ${product.stok}).`);
            }

            // Update Stok Produk di Database Cloud
            await product.update(
                { stok: product.stok - item.qty },
                { transaction: t }
            );

            // Simpan Detail Item
            const itemData = {
                // Generate ID unik untuk item agar tidak duplikat saat sinkron ulang
                id: uuidv5(`${transactionId}-${product_id}`, UUID_NAMESPACE),
                transaction_id: transactionId,
                product_id: product_id,
                qty: item.qty,
                harga: item.harga,
                subtotal: item.subtotal,
                nama_barang: item.namaBarang
            };

            await TransactionItem.upsert(itemData, { transaction: t });
        }

        // Jika semua langkah di atas berhasil, simpan permanen ke database
        await t.commit();

        res.status(201).json({
            message: "Transaction success",
            transactionId: transactionId
        });

    } catch (error) {
        // Jika ada satu saja yang gagal (stok kurang/error server), batalkan semua perubahan
        if (t) await t.rollback();

        console.error('[Transaction Error]', error);
        res.status(500).json({
            error: error.message,
            details: error.errors ? error.errors.map(e => e.message) : null
        });
    }
};

exports.getTransactions = async (req, res) => {
    try {
        let { startDate, endDate, namaPelanggan, page, limit } = req.query;
        const shop_id = req.user.shop_id;

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 20;
        const offset = (page - 1) * limit;

        let whereClause = { shop_id };

        if (startDate && endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            whereClause.tanggal = { [Op.between]: [new Date(startDate), end] };
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

        res.json({
            totalData: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            data: transactions
        });
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