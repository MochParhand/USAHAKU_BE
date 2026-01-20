const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const sequelize = require('./config/db');

// --- 1. IMPORT SEMUA ROUTES ---
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const reportRoutes = require('./routes/reportRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');

// --- 2. KONFIGURASI FOLDER UPLOADS ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// --- 3. IMPORT MODELS ---
const Shop = require('./models/Shop');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Transaction = require('./models/Transaction');
const TransactionItem = require('./models/TransactionItem');
const Purchase = require('./models/Purchase');
const PurchaseItem = require('./models/PurchaseItem');

// --- 4. ASSOCIATIONS (RELASI TABEL) ---
Product.belongsTo(Category, { foreignKey: 'kategori_id' });
Category.hasMany(Product, { foreignKey: 'kategori_id' });

Transaction.hasMany(TransactionItem, { foreignKey: 'transaction_id' });
TransactionItem.belongsTo(Transaction, { foreignKey: 'transaction_id' });
TransactionItem.belongsTo(Product, { foreignKey: 'product_id' });

Purchase.hasMany(PurchaseItem, { foreignKey: 'purchase_id' });
PurchaseItem.belongsTo(Purchase, { foreignKey: 'purchase_id' });
PurchaseItem.belongsTo(Product, { foreignKey: 'product_id' });

const app = express();

// --- 5. MIDDLEWARE ---
app.use(cors()); 
app.use(express.json());

// Logging Request sederhana
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleString()}] ${req.method} ke ${req.url}`);
    next();
});

// --- 6. ROUTES SETUP ---
app.use('/uploads', express.static('uploads')); 
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/shift', shiftRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/purchases', purchaseRoutes);

// Test Route
app.get('/', (req, res) => {
    res.json({ 
        message: "Server Usahaku BE Berjalan Lancar!",
        database: "Connected to Neon PostgreSQL" 
    });
});

// Catch-all 404
app.use((req, res) => {
    res.status(404).json({ error: "Rute tidak ditemukan. Cek baseUrl di Flutter!" });
});

// --- 7. DATABASE SYNC & START SERVER ---
if (process.env.NODE_ENV !== 'vercel') {
    // Jalankan ini jika di Lokal atau Render
    sequelize.sync({ alter: true })
        .then(() => {
            console.log('Database Neon PostgreSQL terhubung dan Sinkron');
            const PORT = process.env.PORT || 3000;
            app.listen(PORT, '0.0.0.0', () => {
                console.log(`Server running on port ${PORT}`);
                console.log(`Database URL: ${process.env.DATABASE_URL ? 'Neon Cloud Terdeteksi' : 'Lokal'}`);
            });
        })
        .catch(err => {
            console.error('Gagal koneksi DB:', err);
        });
} else {
    // Jalankan ini jika di Vercel (Tanpa sync otomatis demi performa serverless)
    sequelize.authenticate()
        .then(() => {
            console.log('Neon Connected (Vercel Mode)');
        })
        .catch(err => {
            console.error('Neon Connection Error:', err);
        });
}

// --- 8. ERROR HANDLERS ---
process.on('uncaughtException', (err) => {
    console.error('[CRITICAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[CRITICAL] Unhandled Rejection:', reason);
});

module