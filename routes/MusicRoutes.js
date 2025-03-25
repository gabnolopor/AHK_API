const express = require('express');
const router = express.Router();
const musicController = require('../controllers/MusicController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

router.get('/music', musicController.getAllMusic);
router.get('/music/:id', musicController.getMusicById);
router.post('/music', upload.single('file'), musicController.addMusic);
router.put('/music/:id', upload.single('file'), musicController.updateMusic);
router.delete('/music/:id', musicController.deleteMusic);

module.exports = router;