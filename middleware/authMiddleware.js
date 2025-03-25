const jwt = require('jsonwebtoken');
const { createModuleLogger } = require('../utils/logger');

const authLogger = createModuleLogger('auth-middleware');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            throw new Error('No token provided');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        
        next();
    } catch (error) {
        authLogger.error({
            type: 'auth_middleware_error',
            error: error.message
        });
        res.status(401).json({ error: 'Please authenticate' });
    }
};

module.exports = authMiddleware;