const sequelize = require('../config/db');
const Shop = require('../models/Shop');
const Category = require('../models/Category');

async function test() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB.');
    
    // Sync to ensure tables exist (use force? no, alter)
    await sequelize.sync({ alter: true }); 

    // 1. Create Shop
    const shop = await Shop.create({
        nama_toko: 'Debug Shop ' + Date.now(),
        alamat: 'Debug Address'
    });
    console.log('Shop created:', shop.id);

    // 2. Create Category
    try {
        const category = await Category.create({
            nama: 'Debug Category',
            shop_id: shop.id
        });
        console.log('Category created:', category.id);
        console.log('SUCCESS');
    } catch (e) {
        console.error('Error creating Category:', e);
    }
    
    // Cleanup
    // await category.destroy();
    // await shop.destroy();

  } catch (error) {
    console.error('FAILURE:', error);
  } finally {
    await sequelize.close();
  }
}

test();
