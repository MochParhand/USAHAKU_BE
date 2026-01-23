const Transaction = require('./models/Transaction');
const sequelize = require('./config/db');

async function check() {
    try {
        const description = await sequelize.getQueryInterface().describeTable('Transactions');
        console.log('Transactions Table Schema:');
        for (const [col, info] of Object.entries(description)) {
            console.log(`${col}: ${info.type}`);
        }

        const count = await Transaction.count();
        console.log('Record count:', count);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
check();
