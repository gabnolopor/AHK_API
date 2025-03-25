const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

const cleanOldLogs = () => {
    const logsDir = path.join(__dirname, '../logs');
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

    fs.readdir(logsDir, (err, files) => {
        if (err) {
            logger.error({
                type: 'log_cleanup_error',
                error: err.message
            });
            return;
        }

        files.forEach(file => {
            const filePath = path.join(logsDir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    logger.error({
                        type: 'log_stat_error',
                        file: file,
                        error: err.message
                    });
                    return;
                }

                if (now - stats.mtime.getTime() > maxAge) {
                    fs.unlink(filePath, err => {
                        if (err) {
                            logger.error({
                                type: 'log_delete_error',
                                file: file,
                                error: err.message
                            });
                        } else {
                            logger.info({
                                type: 'log_deleted',
                                file: file
                            });
                        }
                    });
                }
            });
        });
    });
};

// Run cleanup daily
setInterval(cleanOldLogs, 24 * 60 * 60 * 1000); 