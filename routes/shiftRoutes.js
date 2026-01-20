const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/open', shiftController.openShift);
router.post('/close', shiftController.closeShift);
router.get('/current', shiftController.getCurrentShift);
router.get('/summary', shiftController.getShiftSummary);

module.exports = router;
