const Paintings = require('../models/Paintings');
const { cloudinary } = require('../utils/cloudinary');
const { createModuleLogger } = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const paintingsLogger = createModuleLogger('paintings-controller');

const paintingsController = {
    getAllPaintings: async (req, res) => {
        try {
            const paintings = await Paintings.find({});
            
            // Transform the data to include correct Cloudinary URLs
            const paintingsWithUrls = paintings.map(painting => {
                const publicId = painting.filename;
                
                const imageUrl = cloudinary.url(publicId, {
                    cloud_name: process.env.CLOUDINARY_NAME,
                    secure: true
                });

                return {
                    ...painting.toObject(),
                    imageUrl,
                    publicId
                };
            });

            console.log('Paintings with URLs:', paintingsWithUrls); // Debug log
            
            res.json(paintingsWithUrls);
        } catch (error) {
            console.error('Error details:', error);
            paintingsLogger.error({
                type: 'fetch_all_paintings_error',
                error: error.message,
                stack: error.stack
            });
            res.status(500).json({ error: 'Error fetching paintings' });
        }
    },

    getPaintingById: async (req, res) => {
        try {
            const { id } = req.params;
            const painting = await Paintings.findById(id);
            if (!painting) {
                return res.status(404).json({ error: 'Painting not found' });
            }
            paintingsLogger.info({
                type: 'fetch_single_painting',
                paintingId: id
            });
            res.json(painting);
        } catch (error) {
            paintingsLogger.error({
                type: 'fetch_single_painting_error',
                error: error.message
            });
            res.status(500).json({ error: 'Error fetching painting' });
        }
    },

    addPainting: async (req, res) => {
        try {
            if (!req.file) {
                paintingsLogger.error({
                    type: 'add_painting_error',
                    error: 'No file provided'
                });
                return res.status(400).json({ error: 'No file provided' });
            }

            // Upload to Cloudinary in paintings folder
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'paintings',    
                resource_type: 'image',
                use_filename: true,
                unique_filename: true
            });

            paintingsLogger.info({
                type: 'cloudinary_upload_success',
                publicId: result.public_id,
                url: result.secure_url
            });

            // Create new painting entry with Cloudinary data
            const newPainting = new Paintings({
                filename: result.public_id,
                name: req.body.name,
                description: req.body.description
            });

            await newPainting.save();
            paintingsLogger.info({
                type: 'painting_added',
                paintingId: newPainting._id,
                cloudinaryId: result.public_id
            });

            // Delete the local file after successful upload
            if (req.file && req.file.path) {
                fs.unlink(req.file.path, (err) => {
                    if (err) {
                        console.error('Error deleting local file:', err);
                        paintingsLogger.error({
                            type: 'delete_local_file_error',
                            error: err.message,
                            stack: err.stack
                        });
                    } else {
                        console.log('Local file deleted successfully');
                        paintingsLogger.info({
                            type: 'local_file_deleted',
                            filePath: req.file.path
                        });
                    }
                });
            }

            res.status(201).json(newPainting);
        } catch (error) {
            paintingsLogger.error({
                type: 'add_painting_error',
                error: error.message,
                stack: error.stack
            });
            res.status(500).json({ error: 'Error adding painting' });
        }
    },

    updatePainting: async (req, res) => {
        try {
            const { id } = req.params;
            const updates = {
                name: req.body.name,
                description: req.body.description
            };            

            // If there's a new file, upload it to Cloudinary first
            if (req.file) {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'paintings',    
                    resource_type: 'image',
                    use_filename: true,
                    unique_filename: true
                });

                // Update with new Cloudinary filename
                updates.filename = result.public_id;
                
                // Delete the local file after successful upload
                if (req.file.path) {
                    fs.unlink(req.file.path, (err) => {
                        if (err) {
                            console.error('Error deleting local file:', err);
                            paintingsLogger.error({
                                type: 'delete_local_file_error',
                                error: err.message,
                                stack: err.stack
                            });
                        } else {
                            console.log('Local file deleted successfully');
                            paintingsLogger.info({
                                type: 'local_file_deleted',
                                filePath: req.file.path
                            });
                        }
                    });
                }
            }

            const painting = await Paintings.findByIdAndUpdate(id, updates, { new: true });
            if (!painting) {
                return res.status(404).json({ error: 'Painting not found' });
            }

            paintingsLogger.info({
                type: 'painting_updated',
                paintingId: id
            });
            res.json(painting);
        } catch (error) {
            paintingsLogger.error({
                type: 'update_painting_error',
                error: error.message
            });
            res.status(500).json({ error: 'Error updating painting' });
        }
    },

    deletePainting: async (req, res) => {
        try {
            const { id } = req.params;
            
            // First, get the painting item to get the Cloudinary public_id
            const painting = await Paintings.findById(id);
            if (!painting) {
                return res.status(404).json({ error: 'Painting not found' });
            }

            // Delete from Cloudinary first
            if (painting.filename) {
                await cloudinary.uploader.destroy(painting.filename);
                paintingsLogger.info({
                    type: 'cloudinary_delete_success',
                    publicId: painting.filename
                });
            }

            // Then delete from database
            await Paintings.findByIdAndDelete(id);

            paintingsLogger.info({
                type: 'painting_deleted',
                paintingId: id
            });
            res.json({ message: 'Painting deleted successfully' });
        } catch (error) {
            paintingsLogger.error({
                type: 'delete_painting_error',
                error: error.message
            });
            res.status(500).json({ error: 'Error deleting painting' });
        }
    }
};

module.exports = paintingsController;