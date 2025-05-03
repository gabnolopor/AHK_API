const bunyan = require('bunyan');
const path = require('path');

// Create logger with appropriate streams based on environment
const getLoggerStreams = () => {
    // In production, only log to stdout to avoid file system issues
    if (process.env.NODE_ENV === 'production') {
        return [
            {
                level: 'info',
                stream: process.stdout
            }
        ];
    }
    
    // In development, use file-based logging
    return [
        {
            level: 'info',
            path: path.join(__dirname, '../logs/info.log'),
            type: 'rotating-file',
            period: '1d',
            count: 7,
            serializers: bunyan.stdSerializers
        },
        {
            level: 'error',
            path: path.join(__dirname, '../logs/error.log'),
            type: 'rotating-file',
            period: '1d',
            count: 14,
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
            level: 'debug',
            stream: process.stdout
        }
    ];
};

const logger = bunyan.createLogger({
    name: 'ArtGalleryServer',
    streams: getLoggerStreams(),
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