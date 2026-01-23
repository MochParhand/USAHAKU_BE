const User = require('./models/User');
const Shop = require('./models/Shop');

// Define associations manually for script
User.belongsTo(Shop, { foreignKey: 'shop_id' });
Shop.hasMany(User, { foreignKey: 'shop_id' });

async function check() {
    try {
        const users = await User.findAll({
            attributes: ['id', 'nama', 'email', 'role', 'shop_id'],
            include: [{ model: Shop, attributes: ['id', 'nama_toko'] }]
        });

        users.forEach(u => {
            console.log(`User: ${u.nama} (${u.role}) - Email: ${u.email}`);
            console.log(`  Shop ID in User: ${u.shop_id}`);
            if (u.Shop) {
                console.log(`  Shop in DB: ID ${u.Shop.id} - Name: ${u.Shop.nama_toko}`);
            } else {
                console.log(`  Shop in DB: NOT FOUND`);
            }
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
