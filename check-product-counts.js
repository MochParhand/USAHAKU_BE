const Product = require('./models/Product');

async function check() {
    try {
        const counts = await Product.findAll({
            attributes: [
                'shop_id',
                [Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'product_count']
            ],
            group: ['shop_id'],
            raw: true
        });

        console.log('--- PRODUCT COUNTS PER SHOP ---');
        console.log(JSON.stringify(counts, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
