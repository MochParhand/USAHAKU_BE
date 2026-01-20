const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, isOwner } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Check token for all these routes
router.use(verifyToken);

// Categories
router.get('/categories', productController.getCategories); // Kasir & Owner
router.post('/categories', isOwner, productController.createCategory); // Owner Only
router.put('/categories/:id', isOwner, productController.updateCategory); // Owner Only
router.delete('/categories/:id', isOwner, productController.deleteCategory); // Owner Only

// Products
router.get('/low-stock', productController.getLowStockProducts); // Kasir & Owner
router.get('/', productController.getProducts); // Kasir & Owner
router.post('/', isOwner, upload.single('image'), productController.createProduct); // Owner Only
router.put('/:id', isOwner, upload.single('image'), productController.updateProduct); // Owner Only
router.delete('/:id', isOwner, productController.deleteProduct); // Owner Only

module.exports = router;
