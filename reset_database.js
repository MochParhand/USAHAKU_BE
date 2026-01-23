const sequelize = require('./config/db');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Transaction = require('./models/Transaction');
const TransactionItem = require('./models/TransactionItem');
const Purchase = require('./models/Purchase');
const PurchaseItem = require('./models/PurchaseItem');
const Shift = require('./models/Shift');
const User = require('./models/User');
const Shop = require('./models/Shop');

async function resetDatabase() {
    try {
        console.log('🔄 Starting database reset...');

        // Disable foreign key checks temporarily
        await sequelize.query('SET CONSTRAINTS ALL DEFERRED;');

        // Truncate tables in reverse dependency order
        console.log('📦 Clearing TransactionItems...');
        await TransactionItem.destroy({ where: {}, truncate: true, cascade: true });

        console.log('📦 Clearing PurchaseItems...');
        await PurchaseItem.destroy({ where: {}, truncate: true, cascade: true });

        console.log('📦 Clearing Transactions...');
        await Transaction.destroy({ where: {}, truncate: true, cascade: true });

        console.log('📦 Clearing Purchases...');
        await Purchase.destroy({ where: {}, truncate: true, cascade: true });

        console.log('📦 Clearing Shifts...');
        await Shift.destroy({ where: {}, truncate: true, cascade: true });

        console.log('📦 Clearing Products...');
        await Product.destroy({ where: {}, truncate: true, cascade: true });

        console.log('📦 Clearing Categories...');
        await Category.destroy({ where: {}, truncate: true, cascade: true });

        console.log('📦 Clearing Users (except owners)...');
        await User.destroy({ where: { role: 'kasir' }, truncate: false });

        // Optional: Clear all users including owners
        // await User.destroy({ where: {}, truncate: true, cascade: true });

        // Optional: Clear shops (WARNING: This will delete everything!)
        // await Shop.destroy({ where: {}, truncate: true, cascade: true });

        console.log('✅ Database reset complete!');
        console.log('');
        console.log('📊 Summary:');
        console.log('   - All products deleted');
        console.log('   - All categories deleted');
        console.log('   - All transactions deleted');
        console.log('   - All purchases deleted');
        console.log('   - All shifts deleted');
        console.log('   - Kasir users deleted (owners preserved)');
        console.log('');
        console.log('⚠️  Note: Shop data and owner accounts are preserved.');
        console.log('   To delete everything including shops, uncomment the Shop.destroy line.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting database:', error);
        process.exit(1);
    }
}

// Run the reset
resetDatabase();
