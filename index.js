const express = require('express');
const cors = require('cors'); // Tambahkan ini
const sequelize = require('./config/db');
const authRoutes = require('./routes/authRoutes');

// Load Models agar terbaca oleh Sequelize saat Sync
require('./models/Shop');
require('./models/User');

const app = express();

// --- MIDDLEWARE ---
app.use(cors()); // PENTING: Agar Flutter bisa akses API ini
app.use(express.json());

// --- ROUTES ---
app.use('/api/auth', authRoutes);

// --- DATABASE SYNC & START SERVER ---
// Menggunakan alter: true agar tabel otomatis menyesuaikan jika ada perubahan kolom
sequelize.sync({ alter: true }) 
.then(() => {
    console.log('Database PostgreSQL terhubung & Sinkron');
    // Gunakan 0.0.0.0 agar server bisa diakses dari IP lokal (HP Fisik)
    app.listen(3000, '0.0.0.0', () => {
        console.log('Server running on http://localhost:3000');
    });
})
.catch(err => {
    console.log('Gagal koneksi DB: ' + err);
});