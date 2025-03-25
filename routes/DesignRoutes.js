const express = require('express');
const router = express.Router();
const designController = require('../controllers/DesignController');
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

// Design routes
router.get('/designs', designController.getAllDesigns);
router.get('/designs/:id', designController.getDesignById);
router.post('/designs', upload.single('file'), designController.addDesign);
router.put('/designs/:id', upload.single('file'), designController.updateDesign);
router.delete('/designs/:id', designController.deleteDesign);

module.exports = router;