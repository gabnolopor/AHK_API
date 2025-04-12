const express = require('express');
const router = express.Router();
const digitalArtController = require('../controllers/DigitalArtController');
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

router.get('/digitalart', digitalArtController.getAllDigitalArt);
router.get('/digitalart/:id', digitalArtController.getDigitalArtById);
router.post('/digitalart', upload.single('file'), digitalArtController.createDigitalArt);
router.put('/digitalart/:id', upload.single('file'), digitalArtController.updateDigitalArt);
router.delete('/digitalart/:id', digitalArtController.deleteDigitalArt);

module.exports = router;