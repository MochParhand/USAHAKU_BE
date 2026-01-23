const Product = require('./models/Product');
const sequelize = require('./config/db');

async function check() {
    try {
        const p = await Product.findOne();
        if (p) {
            console.log('Product ID:', p.id);
            console.log('Product ID type:', typeof p.id);
        } else {
            console.log('No products found');
        }
        const description = await sequelize.getQueryInterface().describeTable('Products');
        console.log('Column ID Type:', description.id.type);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
check();
