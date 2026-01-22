const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectModule: require('pg'), // TAMBAHKAN BARIS INI agar tidak error di Vercel
  logging: false,
  dialectOptions: {
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : {
      require: true,
      rejectUnauthorized: false
    }
  }
});

// Cek koneksi hanya jika tidak di Vercel (untuk menghindari log berlebih)
if (process.env.NODE_ENV !== 'vercel') {
  sequelize.authenticate()
    .then(() => console.log('Berhasil terhubung ke database Neon (via Sequelize)'))
    .catch(err => console.error('Gagal koneksi ke database:', err));
}

module.exports = sequelize;