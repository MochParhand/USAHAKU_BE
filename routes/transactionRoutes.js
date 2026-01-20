const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/', transactionController.createTransaction);
router.get('/', transactionController.getTransactions);
router.get('/customers', transactionController.getCustomerNames);

module.exports = router;
