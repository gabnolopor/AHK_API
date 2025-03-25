const express = require('express');
const router = express.Router();
const writingsController = require('../controllers/WritingsController');
const multer = require('multer');
const path = require('path');

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Writing routes
router.get('/writings', writingsController.getAllWritings);
router.get('/writings/:id', writingsController.getWritingById);
router.post('/writings', upload.single('file'), writingsController.addWriting);
router.put('/writings/:id', upload.single('file'), writingsController.updateWriting);
router.delete('/writings/:id', writingsController.deleteWriting);

module.exports = router;