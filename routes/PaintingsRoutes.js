const express = require('express');
const router = express.Router();
const paintingsController = require('../controllers/PaintingsController');
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
router.get('/paintings', paintingsController.getAllPaintings);
router.get('/paintings/:id', paintingsController.getPaintingById);
router.post('/paintings', upload.single('file'), paintingsController.addPainting);
router.put('/paintings/:id', upload.single('file'), paintingsController.updatePainting);
router.delete('/paintings/:id', paintingsController.deletePainting);

module.exports = router;