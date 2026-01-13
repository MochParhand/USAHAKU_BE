const Product = require('../models/Product');
const Category = require('../models/Category');

// --- CATEGORIES ---

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            where: { shop_id: req.user.shop_id }
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { nama } = req.body;
        const category = await Category.create({
            nama,
            shop_id: req.user.shop_id
        });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Category.destroy({
            where: { id, shop_id: req.user.shop_id }
        });
        if (!deleted) return res.status(404).json({ error: "Category not found or unauthorized" });
        res.json({ message: "Category deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- PRODUCTS ---

exports.getProducts = async (req, res) => {
    try {
        console.log("GET /products called");
        console.log("User:", req.user);
        
        const products = await Product.findAll({
            where: { shop_id: req.user.shop_id }
            // include: [{ model: Category, attributes: ['nama'] }] 
        });
        console.log(`Found ${products.length} products`);
        res.json(products);
    } catch (error) {
        console.error("ERROR in getProducts:", error);
        res.status(500).json({ error: error.message });
    }
};

    exports.createProduct = async (req, res) => {
    try {
        const { nama, harga, harga_dasar, stok, min_stok, barcode, is_jasa, kategori_id } = req.body;
        const imagePath = req.file ? req.file.path.replace(/\\/g, "/") : null; // Normalize path
        
        const product = await Product.create({
            nama,
            harga,
            harga_dasar: harga_dasar || 0,
            stok,
            min_stok: min_stok || 5,
            barcode,
            is_jasa,
            kategori_id, 
            image: imagePath, // Save image path
            shop_id: req.user.shop_id
        });
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

    exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama, harga, harga_dasar, stok, min_stok, barcode, is_jasa, kategori_id } = req.body;
        
        const updateData = {
            nama, harga, harga_dasar, stok, min_stok, barcode, is_jasa, kategori_id
        };

        if (req.file) {
            updateData.image = req.file.path.replace(/\\/g, "/");
        }

        const [updated] = await Product.update(updateData, {
            where: { id, shop_id: req.user.shop_id }
        });

        if (!updated) return res.status(404).json({ error: "Product not found or unauthorized" });
        
        res.json({ message: "Product updated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Product.destroy({
            where: { id, shop_id: req.user.shop_id }
        });
        
        if (!deleted) return res.status(404).json({ error: "Product not found or unauthorized" });
        res.json({ message: "Product deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
