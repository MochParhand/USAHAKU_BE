const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/summary', authMiddleware.verifyToken, authMiddleware.isOwner, reportController.getSummary);
router.get('/sales', authMiddleware.verifyToken, authMiddleware.isOwner, reportController.getSalesReport);
router.get('/product-sales', authMiddleware.verifyToken, authMiddleware.isOwner, reportController.getProductSalesAnalysis);
router.get('/customer-sales', authMiddleware.verifyToken, authMiddleware.isOwner, reportController.getCustomerSalesAnalysis);
router.get('/inventory-analysis', authMiddleware.verifyToken, authMiddleware.isOwner, reportController.getInventoryAnalysis);
router.get('/profit-loss', authMiddleware.verifyToken, authMiddleware.isOwner, reportController.getProfitLossAnalysis); // New Route
router.get('/shifts', authMiddleware.verifyToken, authMiddleware.isOwner, reportController.getShiftReports);

module.exports = router;
