const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/summary', authMiddleware.verifyToken, reportController.getSummary);
router.get('/sales', authMiddleware.verifyToken, reportController.getSalesReport);
router.get('/product-sales', authMiddleware.verifyToken, reportController.getProductSalesAnalysis);
router.get('/customer-sales', authMiddleware.verifyToken, reportController.getCustomerSalesAnalysis);
router.get('/customer-sales', authMiddleware.verifyToken, reportController.getCustomerSalesAnalysis);
router.get('/inventory-analysis', authMiddleware.verifyToken, reportController.getInventoryAnalysis);
router.get('/profit-loss', authMiddleware.verifyToken, reportController.getProfitLossAnalysis); // New Route
router.get('/shifts', authMiddleware.verifyToken, reportController.getShiftReports);

module.exports = router;
