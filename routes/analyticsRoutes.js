const express = require('express');
const rateLimit = require('express-rate-limit');
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const visitLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many visit requests' },
});

router.post('/analytics/visit', visitLimiter, analyticsController.recordVisit);
router.get('/admin/analytics', authMiddleware, analyticsController.getStats);

module.exports = router;
