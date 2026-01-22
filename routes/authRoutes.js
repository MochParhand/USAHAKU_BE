const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, isOwner } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'shop-logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Hanya diperbolehkan upload gambar (jpeg, jpg, png, gif)!'));
    }
});

router.post('/register', authController.registerOwner);
router.post('/login', authController.login);
// Hanya Owner yang login yang bisa tambah staff
router.post('/add-staff', verifyToken, isOwner, authController.addStaff);

// Profile Management
router.get('/profile', verifyToken, authController.getProfile);
router.put('/profile', verifyToken, authController.updateProfile);
router.put('/change-password', verifyToken, authController.changePassword);

// Logo Upload Route
router.put('/update-logo', verifyToken, isOwner, upload.single('logo'), authController.updateLogo);

// Employee Management (Owner Only)
router.get('/employees', verifyToken, isOwner, authController.getEmployees);
router.delete('/employees/:id', verifyToken, isOwner, authController.deleteEmployee);

module.exports = router;