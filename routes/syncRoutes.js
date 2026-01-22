const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, syncController.getDeltaSync);

module.exports = router;
