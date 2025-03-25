const fs = require('fs');
const path = require('path');

/**
 * Ensures that the logs directory and required log files exist
 */
function ensureLogDirectories() {
  const logsDir = path.join(__dirname, '../logs');
  
  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logsDir)) {
    console.log('Creating logs directory...');
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  // List of log files to ensure exist
  const logFiles = ['info.log', 'error.log', 'warn.log', 'debug.log'];
  
  // Create each log file if it doesn't exist
  logFiles.forEach(file => {
    const filePath = path.join(logsDir, file);
    if (!fs.existsSync(filePath)) {
      console.log(`Creating log file: ${file}`);
      fs.writeFileSync(filePath, '', 'utf8');
    }
  });
  
  console.log('Log directories and files are ready');
}

module.exports = ensureLogDirectories;