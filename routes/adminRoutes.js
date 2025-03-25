const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admincontroller');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/admin/login', adminController.login);

// Protected routes (require authentication)
router.post('/admin/change-password', authMiddleware, adminController.changePassword);
router.get('/admin/verify-token', authMiddleware, adminController.verifyToken);

module.exports = router;