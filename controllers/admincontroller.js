const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const { createModuleLogger } = require('../utils/logger');

const adminLogger = createModuleLogger('admin-controller');

const adminController = {
    login: async (req, res) => {
        try {
            const { username, password } = req.body;
            console.log('Login attempt for username:', username); // Debug log

            // Find admin by username
            const admin = await Admin.findOne({ username });
            if (!admin) {
                console.log('Admin not found'); // Debug log
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Check password
            const isMatch = await admin.comparePassword(password);
            console.log('Password match:', isMatch); // Debug log

            if (!isMatch) {
                console.log('Password incorrect'); // Debug log
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate JWT token
            const token = jwt.sign(
                { id: admin._id },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            adminLogger.info({
                type: 'admin_login_success',
                adminId: admin._id
            });

            res.json({ token });
        } catch (error) {
            console.error('Login error:', error); // Debug log
            adminLogger.error({
                type: 'admin_login_error',
                error: error.message
            });
            res.status(500).json({ error: 'Error during login' });
        }
    },

    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const adminId = req.admin.id; // From auth middleware

            const admin = await Admin.findById(adminId);
            if (!admin) {
                return res.status(404).json({ error: 'Admin not found' });
            }

            // Verify current password
            const isMatch = await admin.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }

            // Update password
            admin.password = newPassword;
            await admin.save();

            adminLogger.info({
                type: 'password_change_success',
                adminId: admin._id
            });

            res.json({ message: 'Password updated successfully' });
        } catch (error) {
            adminLogger.error({
                type: 'password_change_error',
                error: error.message
            });
            res.status(500).json({ error: 'Error changing password' });
        }
    },

    verifyToken: async (req, res) => {
        try {
            // If middleware passes, token is valid
            res.json({ valid: true });
        } catch (error) {
            adminLogger.error({
                type: 'token_verification_error',
                error: error.message
            });
            res.status(401).json({ valid: false });
        }
    }
};

module.exports = adminController;