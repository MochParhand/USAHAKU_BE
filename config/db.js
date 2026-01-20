const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Wajib ada agar tidak error SSL saat konek ke Neon
    }
  }
});

// Cek koneksi
sequelize.authenticate()
  .then(() => console.log('Berhasil terhubung ke database Neon (via Sequelize)'))
  .catch(err => console.error('Gagal koneksi ke database:', err));

module.exports = sequelize;