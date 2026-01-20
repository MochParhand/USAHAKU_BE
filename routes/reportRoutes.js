const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/summary', authMiddleware.verifyToken, reportController.getSummary);
router.get('/sales', authMiddleware.verifyToken, reportController.getSalesReport);

module.exports = router;
