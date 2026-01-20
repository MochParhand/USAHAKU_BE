const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, isOwner } = require('../middleware/authMiddleware');

router.post('/register', authController.registerOwner);
router.post('/login', authController.login);
// Hanya Owner yang login yang bisa tambah staff
router.post('/add-staff', verifyToken, isOwner, authController.addStaff);

// Profile Management
router.get('/profile', verifyToken, authController.getProfile);
router.put('/profile', verifyToken, authController.updateProfile);

// Employee Management (Owner Only)
router.get('/employees', verifyToken, isOwner, authController.getEmployees);
router.delete('/employees/:id', verifyToken, isOwner, authController.deleteEmployee);

module.exports = router;