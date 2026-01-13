const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const Shop = require('./models/Shop');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Transaction = require('./models/Transaction');
const TransactionItem = require('./models/TransactionItem');

// --- ASSOCIATIONS ---
Product.belongsTo(Category, { foreignKey: 'kategori_id' });
Category.hasMany(Product, { foreignKey: 'kategori_id' });
// Add other associations if needed (e.g. Transaction -> TransactionItem)
Transaction.hasMany(TransactionItem, { foreignKey: 'transaction_id' });
TransactionItem.belongsTo(Transaction, { foreignKey: 'transaction_id' });
TransactionItem.belongsTo(Product, { foreignKey: 'product_id' });

const app = express();

// --- MIDDLEWARE ---
// Pastikan cors() di atas rute apa pun!
app.use(cors()); 
app.use(express.json());

// Tambahkan Logging sederhana untuk memantau request yang masuk
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleString()}] ${req.method} ke ${req.url}`);
    next();
});

// --- ROUTES ---
app.use('/uploads', express.static('uploads')); // Serve uploaded files
app.use('/api/auth', authRoutes);
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));

// --- TEST ROUTE (Agar tidak muncul "Cannot GET /") ---
app.get('/', (req, res) => {
    res.json({ message: "Server Usahaku BE Berjalan Lancar!" });
});

// --- CATCH-ALL ROUTE (Jika URL salah panggil) ---
app.use((req, res) => {
    console.log(`WASTED: Seseorang memanggil ${req.url} tapi tidak ada rutenya!`);
    res.status(404).json({ error: "Rute tidak ditemukan. Cek baseUrl di Flutter!" });
});

// --- DATABASE SYNC & START SERVER ---
sequelize.sync({ alter: true }) 
.then(() => {
    console.log('Database PostgreSQL terhubung & Sinkron');
    // Gunakan port 3000 dan host 0.0.0.0 agar bisa diakses IP lokal
    app.listen(3000, '0.0.0.0', () => {
        console.log('Server running on http://localhost:3000');
    });
})
.catch(err => {
    console.log('Gagal koneksi DB: ' + err);
});