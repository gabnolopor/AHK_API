const express = require('express');
const router = express.Router();
const biographyController = require('../controllers/BiographyController');

router.get('/biography', biographyController.getBiography);
router.put('/biography', biographyController.updateBiography);

module.exports = router;    
