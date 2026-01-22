const sequelize = require('./config/db');
const User = require('./models/User');
const Shop = require('./models/Shop');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Transaction = require('./models/Transaction');
const TransactionItem = require('./models/TransactionItem');
const Purchase = require('./models/Purchase');
const PurchaseItem = require('./models/PurchaseItem');
const Shift = require('./models/Shift');
const bcrypt = require('bcryptjs');

// Helper to generate random int
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Toy names list for variety
const toyTypes = ['Robot', 'Boneka', 'Mobil Remote', 'Puzzle', 'Lego Set', 'Layangan', 'Yoyo', 'Gasing', 'Kartu Mainan', 'Pistol Air'];
const adjectives = ['Super', 'Keren', 'Cepat', 'Lucu', 'Jumbo', 'Mini', 'Warna-warni', 'Terbaru', 'Edisi Terbatas', 'Premium'];

const generateToyName = (index) => {
    const type = toyTypes[index % toyTypes.length];
    const adj = adjectives[index % adjectives.length];
    return `${adj} ${type} #${index + 1}`;
};

const seed = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Force sync to clear all data
        await sequelize.sync({ force: true });
        console.log('Database reset (sync { force: true }).');

        // 1. Create Shop
        const shop = await Shop.create({
            nama_toko: 'Istana Mainan Citalaksana',
            alamat: 'Jl. Mainan No. 123, Jakarta',
            logo: null
        });
        console.log('Shop created.');

        // 2. Create User (Owner)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('12345678', salt);

        await User.create({
            nama: 'Citalaksana',
            email: 'citalaksana@gmail.com',
            password: hashedPassword,
            role: 'owner',
            shop_id: shop.id
        });
        console.log('User created: citalaksana@gmail.com');

        // 3. Create Categories
        const categories = await Category.bulkCreate([
            { nama: 'Action Figures', shop_id: shop.id },
            { nama: 'Boneka & Plush', shop_id: shop.id },
            { nama: 'Kendaraan Mainan', shop_id: shop.id },
            { nama: 'Edukasi & Puzzle', shop_id: shop.id },
            { nama: 'Mainan Outdoor', shop_id: shop.id }
        ]);
        console.log('Categories created.');

        // 4. Create 50 Products
        const productsData = [];
        for (let i = 0; i < 50; i++) {
            const priceBase = randomInt(10, 500) * 1000; // 10k to 500k
            const margin = randomInt(10, 50) / 100; // 10% to 50% profit
            const sellingPrice = priceBase + (priceBase * margin);

            // Round to nearest 500
            const finalSelling = Math.ceil(sellingPrice / 500) * 500;
            const finalBase = priceBase;

            productsData.push({
                nama: generateToyName(i),
                harga: finalSelling, // Harga Jual
                harga_dasar: finalBase, // Harga Modal
                stok: randomInt(5, 100),
                min_stok: 5,
                kategori_id: categories[i % categories.length].id,
                shop_id: shop.id,
                is_jasa: false,
                is_deleted: false,
                barcode: `TOY-${1000 + i}`
            });
        }

        await Product.bulkCreate(productsData);
        console.log('50 Products seeded.');

        console.log('SEEDING COMPLETE!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seed();
