const bunyan = require('bunyan');
const path = require('path');

// Create rotating file streams for different log levels
const logger = bunyan.createLogger({
    name: 'ArtGalleryServer',
    streams: [
        {
            level: 'info',
            path: path.join(__dirname, '../logs/info.log'),
            type: 'rotating-file',
            period: '1d',    // Rotate daily
            count: 7,        // Keep 7 days of logs
            serializers: bunyan.stdSerializers
        },
        {
            level: 'error',
            path: path.join(__dirname, '../logs/error.log'),
            type: 'rotating-file',
            period: '1d',    // Rotate daily
            count: 14,       // Keep 14 days of error logs
            serializers: bunyan.stdSerializers
        },
        {
            level: 'debug',
            path: path.join(__dirname, '../logs/debug.log'),
            type: 'rotating-file',
            period: '1d',
            count: 3
        },
        {
            // Always log to console in development
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
            stream: process.stdout
        }
    ]
});

// Create specific loggers for different modules
const createModuleLogger = (moduleName) => {
    return logger.child({ module: moduleName });
};

// Custom serializers for common objects
const customSerializers = {
    err: bunyan.stdSerializers.err,
    req: function (req) {
        if (!req || !req.connection) return req;
        return {
            method: req.method,
            url: req.url,
            headers: req.headers,
            remoteAddress: req.connection.remoteAddress,
            remotePort: req.connection.remotePort
        };
    },
    res: function (res) {
        if (!res || !res.statusCode) return res;
        return {
            statusCode: res.statusCode,
            header: res._header
        };
    }
};

module.exports = {
    logger,
    createModuleLogger,
    customSerializers
}; 