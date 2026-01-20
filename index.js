const express = require('express');
const fs = require('fs');
const path = require('path'); // Gunakan path untuk folder upload agar lebih aman
const cors = require('cors');
const sequelize = require('./config/db'); // Pastikan ini file Sequelize yang pakai DATABASE_URL tadi

// Pastikan folder uploads ada
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// --- MODELS ---
const Shop = require('./models/Shop');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Transaction = require('./models/Transaction');
const TransactionItem = require('./models/TransactionItem');
const Purchase = require('./models/Purchase');
const PurchaseItem = require('./models/PurchaseItem');

// --- ROUTES ---
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const shiftRoutes = require('./routes/shiftRoutes');

// --- ASSOCIATIONS ---
Product.belongsTo(Category, { foreignKey: 'kategori_id' });
Category.hasMany(Product, { foreignKey: 'kategori_id' });

Transaction.hasMany(TransactionItem, { foreignKey: 'transaction_id' });
TransactionItem.belongsTo(Transaction, { foreignKey: 'transaction_id' });
TransactionItem.belongsTo(Product, { foreignKey: 'product_id' });

Purchase.hasMany(PurchaseItem, { foreignKey: 'purchase_id' });
PurchaseItem.belongsTo(Purchase, { foreignKey: 'purchase_id' });
PurchaseItem.belongsTo(Product, { foreignKey: 'product_id' });

const app = express();

// --- MIDDLEWARE ---
app.use(cors()); 
app.use(express.json());

// Logging Request
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleString()}] ${req.method} ke ${req.url}`);
    next();
});

// --- ROUTES SETUP ---
app.use('/uploads', express.static('uploads'));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/shift', shiftRoutes);
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/purchases', require('./routes/purchaseRoutes'));

app.get('/', (req, res) => {
    res.json({ 
        message: "Server Usahaku BE Berjalan Lancar!",
        database: "Connected to Neon PostgreSQL" 
    });
});

app.use((req, res) => {
    res.status(404).json({ error: "Rute tidak ditemukan. Cek baseUrl di Flutter!" });
});

// --- DATABASE SYNC & START SERVER ---
// Gunakan alter: true untuk development agar tabel otomatis dibuat di Neon
sequelize.sync({ alter: true })
    .then(() => {
        console.log('✅ Database Neon PostgreSQL terhubung & Sinkron');
        
        // Render biasanya memberikan PORT melalui process.env.PORT
        // Di lokal akan default ke 3000
        const PORT = process.env.PORT || 3000;
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📡 Database URL: ${process.env.DATABASE_URL ? 'Neon Cloud' : 'Not Found'}`);
        });
    })
    .catch(err => {
        console.error('❌ Gagal koneksi DB:', err);
    });

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    process.exit(0);
});

// --- GLOBAL ERROR HANDLERS ---
process.on('uncaughtException', (err) => {
    console.error('[CRITICAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[CRITICAL] Unhandled Rejection:', reason);
});