const { v2: cloudinary } = require('cloudinary');
const { createModuleLogger } = require('./logger');

const cloudinaryLogger = createModuleLogger('cloudinary');

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_SECRET 
});

// Test connection
const testConnection = async () => {
    try {
        const result = await cloudinary.api.ping();
        cloudinaryLogger.info({
            type: 'cloudinary_connection_success',
            result
        });
        return true;
    } catch (error) {
        cloudinaryLogger.error({
            type: 'cloudinary_connection_error',
            error: error.message
        });
        return false;
    }
};

module.exports = {
    cloudinary,
    testConnection
};