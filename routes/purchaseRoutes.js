const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { verifyToken, isOwner } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(isOwner); // Only owner can manage purchases (restock)

router.get('/', purchaseController.getPurchases);
router.post('/', purchaseController.createPurchase);

module.exports = router;
