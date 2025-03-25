const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
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

// Routes
router.get('/content', contentController.getAllContent);
router.get('/content/category/:category', contentController.getContentByCategory);
router.get('/content/:id', contentController.getContentById);
router.post('/content', upload.single('file'), contentController.addContent);
router.put('/content/:id', upload.single('file'), contentController.updateContent);
router.delete('/content/:id', contentController.deleteContent);

module.exports = router; 