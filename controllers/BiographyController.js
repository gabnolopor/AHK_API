const Biography = require('../models/Biography');
const { createModuleLogger } = require('../utils/logger');


const biographyLogger = createModuleLogger('biography-controller');


const biographyController = {
    getBiography: async (req, res) => {
        try {
            const biography = await Biography.findOne();
            if (!biography) {
                return res.status(404).json({ message: "No biography found" });
            }
            res.status(200).json(biography);
        } catch (error) {
            biographyLogger.error({
                type: 'fetch_biography_error',
                error: error.message,
                stack: error.stack
            });
            res.status(500).json({ message: error.message });
        }
    },

    updateBiography: async (req, res) => {
        try {
            const { id } = req.body; // Ensure the ID is passed in the request body
            const updates = {
                title: req.body.title,
                text: req.body.text
            };

            const updatedBiography = await Biography.findByIdAndUpdate(id, updates, { new: true });

            if (!updatedBiography) {
                return res.status(404).json({ error: 'Biography not found' });
            }

            res.json(updatedBiography);
        } catch (error) {
            console.error("Error updating biography:", error);
            res.status(500).json({ error: 'Error updating biography' });
        }
    }
};

module.exports = biographyController;