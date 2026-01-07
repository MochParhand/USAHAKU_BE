const jwt = require('jsonwebtoken');

/**
 * Middleware untuk memverifikasi apakah user memiliki Token JWT yang valid
 */
exports.verifyToken = (req, res, next) => {
    // 1. Ambil token dari Header Authorization (format: "Bearer <token>")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // 2. Jika token tidak ada
    if (!token) {
        return res.status(403).json({ 
            message: "Akses ditolak! Token tidak ditemukan." 
        });
    }

    try {
        // 3. Verifikasi token menggunakan secret key dari .env
        // Jika JWT_SECRET tidak terbaca, gunakan fallback 'secret_usahaku' agar tidak error
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_usahaku');
        
        // 4. Simpan data user yang didecode ke dalam object request (req.user)
        req.user = decoded;
        
        // 5. Lanjut ke fungsi berikutnya (controller)
        next();
    } catch (error) {
        // Jika token expired atau dimodifikasi
        return res.status(401).json({ 
            message: "Token tidak valid atau sudah kadaluarsa." 
        });
    }
};

/**
 * Middleware untuk memastikan hanya user dengan role 'owner' yang bisa akses
 */
exports.isOwner = (req, res, next) => {
    // Pastikan req.user sudah diisi oleh middleware verifyToken sebelumnya
    if (!req.user) {
        return res.status(500).json({ 
            message: "Internal Server Error: User data not found in request." 
        });
    }

    // Cek apakah role user adalah owner
    if (req.user.role !== 'owner') {
        return res.status(403).json({ 
            message: "Akses ditolak! Hanya Pemilik (Owner) yang diizinkan." 
        });
    }

    next();
};