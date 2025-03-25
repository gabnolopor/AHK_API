const express = require('express');
const router = express.Router();
const photographyController = require('../controllers/PhotographyController');
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

// Painting routes
router.get('/photography', photographyController.getAllPhotography);
router.get('/photography/:id', photographyController.getPhotographyById);
router.post('/photography', upload.single('file'), photographyController.addPhotography);
router.put('/photography/:id', upload.single('file'), photographyController.updatePhotography);
router.delete('/photography/:id', photographyController.deletePhotography);

module.exports = router;