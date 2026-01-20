const express = require('express');
const fs = require('fs'); // Ensure uploads folder exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}
const cors = require('cors');
const sequelize = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const shiftRoutes = require('./routes/shiftRoutes');

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
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/shift', shiftRoutes);
app.use('/api/reports', require('./routes/reportRoutes'));

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
        const DEFAULT_PORT = parseInt(process.env.PORT) || 3000;
        const MAX_RETRIES = 5;
        let attempt = 0;
        const startServer = (port) => {
            const server = app.listen(port, '0.0.0.0', () => {
                console.log(`Server running on http://localhost:${port}`);
            });
            // Store server globally for graceful shutdown
            global.__server = server;
            server.on('error', (e) => {
                if (e.code === 'EADDRINUSE' && attempt < MAX_RETRIES) {
                    console.error(`Port ${port} already in use, trying next port...`);
                    attempt++;
                    startServer(port + 1);
                } else {
                    console.error('SERVER ERROR:', e);
                }
            });
        };
        startServer(DEFAULT_PORT);
        // FORCE KEEP ALIVE: Prevent process from exiting if event loop empties
        setInterval(() => {
            // Heartbeat to keep process running
        }, 60000);
    })
    .catch(err => {
        console.log('Gagal koneksi DB: ' + err);
    });


// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Received SIGINT. Press Control-D to exit.');
});

// --- GLOBAL ERROR HANDLERS (Prevent Crash) ---
process.on('uncaughtException', (err) => {
    console.error('[CRITICAL] Uncaught Exception:', err);
    // Optional: Graceful shutdown logic here if needed, but for dev we keep it alive
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});