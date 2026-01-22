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
        const user = await User.findOne({
            where: { email },
            include: [{ model: Shop, attributes: ['nama_toko', 'logo'] }]
        });

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
                shop_id: user.shop_id,
                shop_name: user.Shop ? user.Shop.nama_toko : "Toko Saya",
                shop_logo: user.Shop ? user.Shop.logo : null
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

// 4. GET PROFILE
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] },
            include: [{ model: Shop, attributes: ['nama_toko', 'logo', 'alamat'] }]
        });
        if (!user) return res.status(404).json({ error: "User tidak ditemukan" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. UPDATE PROFILE
exports.updateProfile = async (req, res) => {
    try {
        const { nama, email } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

        // Cek email unique jika berubah
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) return res.status(400).json({ error: "Email sudah digunakan user lain" });
            user.email = email;
        }

        if (nama) user.nama = nama;

        await user.save();

        res.json({ message: "Profil berhasil diperbarui", user: { id: user.id, nama: user.nama, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 6. GET EMPLOYEES (Owner Only)
exports.getEmployees = async (req, res) => {
    try {
        // req.user.shop_id comes from token
        const employees = await User.findAll({
            where: {
                shop_id: req.user.shop_id,
                role: 'kasir'
            },
            attributes: { exclude: ['password'] }
        });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 7. DELETE EMPLOYEE (Owner Only)
exports.deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await User.findOne({
            where: {
                id,
                shop_id: req.user.shop_id,
                role: 'kasir'
            }
        });

        if (!employee) return res.status(404).json({ error: "Karyawan tidak ditemukan atau bukan milik Anda" });

        await employee.destroy();
        res.json({ message: "Karyawan berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 8. CHANGE PASSWORD
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

        // Verify Old Password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ error: "Password lama salah" });

        // Hash New Password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: "Password berhasil diubah" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 9. UPDATE LOGO TOKO (Owner Only)
exports.updateLogo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Tidak ada file yang diupload" });
        }

        const shopId = req.user.shop_id;
        const shop = await Shop.findByPk(shopId);

        if (!shop) {
            return res.status(404).json({ error: "Toko tidak ditemukan" });
        }

        // Simpan path relatif atau full URL tergantung kebutuhan
        // Di sini simpan path relatif: 'uploads/filename.jpg'
        // Nanti frontend tinggal gabungin dengan Base URL
        const logoPath = req.file.path.replace(/\\/g, "/"); // Normalize path for Windows/Unix compatibility

        shop.logo = logoPath;
        await shop.save();

        res.json({
            message: "Logo berhasil diupload",
            logoUrl: logoPath
        });

    } catch (error) {
        console.error("Error upload logo:", error);
        res.status(500).json({ error: error.message });
    }
};