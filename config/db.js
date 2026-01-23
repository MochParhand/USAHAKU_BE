const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

// Instance untuk aplikasi
const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  dialectModule: require('pg'),
  logging: false,
  dialectOptions: {
    // Hanya gunakan SSL jika koneksi mengarah ke Neon (Cloud)
    ssl: dbUrl && dbUrl.includes('neon.tech')
      ? { require: true, rejectUnauthorized: false }
      : false
  }
});

// Konfigurasi untuk CLI (npx sequelize-cli)
const config = {
  development: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectModule: require('pg'),
    dialectOptions: {
      // Logika yang sama: SSL aktif hanya jika di Cloud
      ssl: (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech'))
        ? { require: true, rejectUnauthorized: false }
        : false
    }
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectModule: require('pg'),
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false }
    }
  }
};

// Default export for models (sequelize instance)
module.exports = sequelize;

// Named export for sequelize-cli (config object)
module.exports.config = config;