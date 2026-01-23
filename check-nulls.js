const Product = require('./models/Product');
const Category = require('./models/Category');

async function check() {
    try {
        const nullShopProducts = await Product.count({ where: { shop_id: null } });
        console.log(`Products with shop_id null: ${nullShopProducts}`);

        const nullShopCategories = await Category.count({ where: { shop_id: null } });
        console.log(`Categories with shop_id null: ${nullShopCategories}`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
