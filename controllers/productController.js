const Product = require('../models/Product');
const Category = require('../models/Category');
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const fs = require('fs'); // Import fs for file deletion

// --- CATEGORIES ---

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            where: {
                shop_id: req.user.shop_id,
                is_deleted: false
            },
            attributes: ['id', 'nama']
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { nama } = req.body;

        // Check for duplicate name
        const existingCategory = await Category.findOne({
            where: {
                nama: { [Op.iLike]: nama.trim() },
                shop_id: req.user.shop_id,
                is_deleted: false
            }
        });

        if (existingCategory) {
            return res.status(400).json({ error: "Nama kategori sudah ada!" });
        }

        const category = await Category.create({
            nama: nama.trim(),
            shop_id: req.user.shop_id
        });
        res.status(201).json(category);
    } catch (error) {
        console.error("Create Category Error:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama } = req.body;
        const [updated] = await Category.update({ nama }, {
            where: { id, shop_id: req.user.shop_id }
        });

        if (!updated) return res.status(404).json({ error: "Category not found or unauthorized" });
        res.json({ message: "Category updated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const [updated] = await Category.update({ is_deleted: true }, {
            where: { id, shop_id: req.user.shop_id }
        });
        if (!updated) return res.status(404).json({ error: "Category not found or unauthorized" });
        res.json({ message: "Category deleted (archived)" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- PRODUCTS ---

exports.getLowStockProducts = async (req, res) => {
    try {
        console.log("GET /low-stock called - DEBUG MODE V2");
        const allProducts = await Product.findAll({
            where: {
                shop_id: req.user.shop_id,
                is_deleted: false
            }
        });

        console.log(`Total products: ${allProducts.length}`);

        const lowStock = allProducts.filter(p => {
            // Handle nulls safely
            const stok = p.stok !== null ? parseInt(p.stok, 10) : 0;
            const minStok = p.min_stok !== null ? parseInt(p.min_stok, 10) : 5; // Default 5 if null

            console.log(`Product ${p.nama}: stok=${stok}, min=${minStok}`);
            return stok <= minStok;
        });

        console.log(`Debug filtered found: ${lowStock.length} items`);

        res.json(lowStock);
    } catch (error) {
        console.error("Error in getLowStockProducts:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getProducts = async (req, res) => {
    try {
        let { page, limit, search } = req.query;

        // Default values
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 100; // Default limit 100 for better mobile experience
        const offset = (page - 1) * limit;

        const whereCondition = {
            shop_id: req.user.shop_id,
            is_deleted: false
        };

        if (search) {
            whereCondition.nama = { [Op.iLike]: `%${search}%` };
        }

        // Use findAndCountAll to get total count for pagination headers
        const { count, rows: products } = await Product.findAndCountAll({
            where: whereCondition,
            attributes: ['id', 'nama', 'harga', 'harga_dasar', 'stok', 'min_stok', 'barcode', 'is_jasa', 'kategori_id', 'image'],
            limit: limit,
            offset: offset,
            order: [['nama', 'ASC']]
        });

        // Set Pagination Headers
        res.set('X-Total-Count', count);
        res.set('X-Total-Pages', Math.ceil(count / limit));
        res.set('Cache-Control', 'public, max-age=60'); // Cache for 60 seconds

        res.json(products);
    } catch (error) {
        console.error("ERROR in getProducts:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        console.log("CREATE PRODUCT - Body:", req.body);
        console.log("CREATE PRODUCT - File:", req.file);

        let { nama, harga, harga_dasar, stok, min_stok, barcode, is_jasa, kategori_id } = req.body;

        // Check for duplicate name
        const existingProduct = await Product.findOne({
            where: {
                nama,
                shop_id: req.user.shop_id,
                is_deleted: false
            }
        });

        if (existingProduct) {
            // Delete uploaded file if exists to prevent clutter
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ error: "Nama barang sudah digunakan, mohon gunakan nama lain." });
        }

        // Parse "FormData" strings to correct types
        harga = !isNaN(parseInt(harga)) ? parseInt(harga) : 0;
        harga_dasar = !isNaN(parseInt(harga_dasar)) ? parseInt(harga_dasar) : 0;
        stok = !isNaN(parseInt(stok)) ? parseInt(stok) : 0;
        min_stok = !isNaN(parseInt(min_stok)) ? parseInt(min_stok) : 5;
        kategori_id = (kategori_id && !isNaN(parseInt(kategori_id))) ? parseInt(kategori_id) : null;

        // Handle boolean is_jasa (which might be "true"/"false" string)
        if (typeof is_jasa === 'string') {
            is_jasa = is_jasa.toLowerCase() === 'true';
        }

        const imagePath = req.file ? req.file.path.replace(/\\/g, "/") : null; // Normalize path

        const product = await Product.create({
            nama,
            harga,
            harga_dasar,
            stok,
            min_stok,
            barcode,
            is_jasa,
            kategori_id,
            image: imagePath, // Save image path
            shop_id: req.user.shop_id
        });
        res.status(201).json(product);
    } catch (error) {
        console.error("Create Product Error:", error);
        // Clean up file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        let { nama, harga, harga_dasar, stok, min_stok, barcode, is_jasa, kategori_id } = req.body;

        // Check for duplicate name if name is being updated
        if (nama) {
            const existingProduct = await Product.findOne({
                where: {
                    nama,
                    shop_id: req.user.shop_id,
                    is_deleted: false,
                    id: { [Op.ne]: id }
                }
            });

            if (existingProduct) {
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({ error: "Nama barang sudah digunakan, mohon gunakan nama lain." });
            }
        }

        const updateData = {
            nama,
            barcode,
            // Parse numeric fields
            harga: !isNaN(parseInt(harga)) ? parseInt(harga) : 0,
            harga_dasar: !isNaN(parseInt(harga_dasar)) ? parseInt(harga_dasar) : 0,
            stok: !isNaN(parseInt(stok)) ? parseInt(stok) : 0,
            min_stok: !isNaN(parseInt(min_stok)) ? parseInt(min_stok) : 5,
            kategori_id: (kategori_id && !isNaN(parseInt(kategori_id))) ? parseInt(kategori_id) : null,
            // Parse boolean
            is_jasa: (typeof is_jasa === 'string') ? (is_jasa.toLowerCase() === 'true') : !!is_jasa
        };

        if (req.file) {
            updateData.image = req.file.path.replace(/\\/g, "/");

            // Find old product to delete old image
            const oldProduct = await Product.findOne({ where: { id, shop_id: req.user.shop_id } });
            if (oldProduct && oldProduct.image) {
                try {
                    if (fs.existsSync(oldProduct.image)) {
                        fs.unlinkSync(oldProduct.image);
                        console.log(`Deleted old image: ${oldProduct.image}`);
                    }
                } catch (err) {
                    console.error("Failed to delete old image:", err);
                }
            }
        }

        const [updated] = await Product.update(updateData, {
            where: { id, shop_id: req.user.shop_id }
        });

        if (!updated) return res.status(404).json({ error: "Product not found or unauthorized" });

        res.json({ message: "Product updated" });
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: error.message });
        }
        if (error.name === 'SequelizeDatabaseError' && error.parent && error.parent.code === '22P02') {
            // Invalid text representation (e.g. string ID for integer column)
            return res.status(404).json({ error: "Product not found (Invalid ID)" });
        }
        res.status(500).json({ error: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Find product first
        const product = await Product.findOne({
            where: { id, shop_id: req.user.shop_id }
        });

        if (!product) return res.status(404).json({ error: "Product not found or unauthorized" });

        // Update record (Soft Delete)
        await Product.update({ is_deleted: true }, {
            where: { id, shop_id: req.user.shop_id }
        });

        res.json({ message: "Product soft deleted (archived)" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
