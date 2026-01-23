const sequelize = require('./config/db');

async function fixTables() {
    try {
        console.log('Dropping tables to fix ID types...');
        // Drop TransactionItems first because of foreign key
        await sequelize.query('DROP TABLE IF EXISTS "TransactionItems" CASCADE;');
        await sequelize.query('DROP TABLE IF EXISTS "Transactions" CASCADE;');
        console.log('Tables dropped.');

        // Now sync to recreate them
        const Transaction = require('./models/Transaction');
        const TransactionItem = require('./models/TransactionItem');

        // Need to define associations again if sequelize.sync is called on the instance
        // But index.js already does that. Let's just run sync() here for these models.
        await sequelize.sync({ alter: true });
        console.log('Tables recreated with new schema.');

        const description = await sequelize.getQueryInterface().describeTable('Transactions');
        console.log('New ID type for Transactions:', description.id.type);
    } catch (err) {
        console.error('Error fixing tables:', err);
    } finally {
        process.exit();
    }
}

fixTables();
