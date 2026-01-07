const User = require('../models/User');
const Shop = require('../models/Shop');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sequelize = require('../config/db'); // Import koneksi DB untuk transaksi

// 1. REGISTER OWNER + SHOP (DENGAN TRANSAKSI AMAN)
exports.registerOwner = async (req, res) => {
    const t = await sequelize.transaction(); // Mulai transaksi
    try {
        const { nama, email, password, nama_toko } = req.body;

        // Cek email duplikat
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "Email sudah terdaftar" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Buat Toko
        const newShop = await Shop.create({ nama_toko }, { transaction: t });

        // Buat User Owner terkait Toko tersebut
        const newUser = await User.create({
            nama,
            email,
            password: hashedPassword,
            role: 'owner',
            shop_id: newShop.id
        }, { transaction: t });

        await t.commit(); // Simpan permanen jika semua sukses
        res.status(201).json({ message: "Registrasi Berhasil", userId: newUser.id });

    } catch (error) {
        await t.rollback(); // Batalkan semua jika ada satu saja yang gagal
        console.error("Error Register:", error);
        res.status(500).json({ error: error.message });
    }
};

// 2. LOGIN (SESUAI USERMODEL FLUTTER)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Password salah" });

        const token = jwt.sign(
            { id: user.id, role: user.role, shop_id: user.shop_id },
            process.env.JWT_SECRET || 'secret_usahaku',
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                nama: user.nama,
                role: user.role,
                shop_id: user.shop_id
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. ADD STAFF (HANYA UNTUK KASIR)
exports.addStaff = async (req, res) => {
    try {
        const { nama, email, password } = req.body;

        // Cek apakah email staff sudah terdaftar
        const existingStaff = await User.findOne({ where: { email } });
        if (existingStaff) {
            return res.status(400).json({ error: "Email staff sudah digunakan" });
        }

        // req.user didapat dari middleware verifyToken
        const ownerShopId = req.user.shop_id;
        const hashedPassword = await bcrypt.hash(password, 10);

        const newStaff = await User.create({
            nama,
            email,
            password: hashedPassword,
            role: 'kasir',
            shop_id: ownerShopId
        });

        res.status(201).json({ 
            message: "Staff berhasil ditambahkan", 
            staffId: newStaff.id 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};