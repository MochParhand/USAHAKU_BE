const Purchase = require('../models/Purchase');
const PurchaseItem = require('../models/PurchaseItem');
const Product = require('../models/Product');
const sequelize = require('../config/db');

exports.createPurchase = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { supplier, total_biaya, keterangan, items } = req.body;
        // items: [{ product_id, jumlah, harga_beli }]

        const purchase = await Purchase.create({
            tanggal: new Date(),
            supplier,
            total_biaya,
            keterangan,
            shop_id: req.user.shop_id,
            user_id: req.user.id // Track creator
        }, { transaction: t });

        for (const item of items) {
            await PurchaseItem.create({
                purchase_id: purchase.id,
                product_id: item.product_id,
                jumlah: item.jumlah,
                harga_beli: item.harga_beli
            }, { transaction: t });

            // Update Stock & Harga Dasar
            const product = await Product.findOne({
                where: { id: item.product_id, shop_id: req.user.shop_id }
            });

            if (product) {
                await product.update({
                    stok: (product.stok || 0) + parseInt(item.jumlah),
                    harga_dasar: parseInt(item.harga_beli)
                }, { transaction: t });
            }
        }

        await t.commit();
        res.status(201).json(purchase);
    } catch (error) {
        await t.rollback();
        console.error("Purchase Error:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getPurchases = async (req, res) => {
    try {
        const purchases = await Purchase.findAll({
            where: { shop_id: req.user.shop_id },
            include: [{
                model: PurchaseItem,
                include: [{ model: Product, attributes: ['nama'] }]
            }],
            order: [['tanggal', 'DESC']]
        });
        res.json(purchases);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
