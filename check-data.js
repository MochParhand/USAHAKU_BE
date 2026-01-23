const Product = require('./models/Product');
const User = require('./models/User');
const Shop = require('./models/Shop');

async function check() {
    try {
        const users = await User.findAll({ attributes: ['id', 'email', 'shop_id'] });
        console.log('--- USERS ---');
        console.log(JSON.stringify(users, null, 2));

        const products = await Product.findAll({ attributes: ['id', 'nama', 'shop_id'], limit: 10 });
        console.log('--- PRODUCTS ---');
        console.log(JSON.stringify(products, null, 2));

        const shops = await Shop.findAll();
        console.log('--- SHOPS ---');
        console.log(JSON.stringify(shops, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
