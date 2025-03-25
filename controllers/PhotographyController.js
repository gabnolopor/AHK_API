const Photography = require('../models/Photography');
const { cloudinary } = require('../utils/cloudinary');
const { createModuleLogger } = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const photographyLogger = createModuleLogger('photography-controller');

const photographyController = {
    getAllPhotography: async (req, res) => {
        try {
            const photography = await Photography.find({});
            
            // Transform the data to include correct Cloudinary URLs
            const photographyWithUrls = photography.map(photo => {

                const publicId = photo.filename;
                
                const imageUrl = cloudinary.url(publicId, {
                    cloud_name: process.env.CLOUDINARY_NAME,
                    secure: true,
                });

                return {
                    ...photo.toObject(),
                    imageUrl,
                    publicId
                };
            });

            console.log('Photos with URLs:', photographyWithUrls); // Debug log
            
            res.json(photographyWithUrls);
        } catch (error) {
            console.error('Error details:', error);
            photographyLogger.error({
                type: 'fetch_all_photography_error',
                error: error.message,
                stack: error.stack
            });
            res.status(500).json({ error: 'Error fetching photography' });
        }
    },

    getPhotographyById: async (req, res) => {
        try {
            const { id } = req.params;
            const photography = await Photography.findById(id);
            if (!photography) {
                return res.status(404).json({ error: 'Photography not found' });
            }
            photographyLogger.info({
                type: 'fetch_single_photography',
                photographyId: id
            });
            res.json(photography);
        } catch (error) {
            photographyLogger.error({
                type: 'fetch_single_photography_error',
                error: error.message
            });
            res.status(500).json({ error: 'Error fetching photography' });
        }
    },

    addPhotography: async (req, res) => {
        try {
            if (!req.file) {
                photographyLogger.error({
                    type: 'add_photography_error',
                    error: 'No file provided'
                });
                return res.status(400).json({ error: 'No file provided' });
            }

            // Upload to Cloudinary in the 'photography' folder
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'photography',    
                resource_type: 'image',
                use_filename: true,
                unique_filename: true
            });

            photographyLogger.info({
                type: 'cloudinary_upload_success',
                publicId: result.public_id,
                url: result.secure_url
            });

            // Create new photography entry with Cloudinary data
            const newPhotography = new Photography({
                filename: result.public_id, // This will now include 'samples/' prefix
                name: req.body.name,
                description: req.body.description
            });

            await newPhotography.save();
            photographyLogger.info({
                type: 'photography_added',
                photographyId: newPhotography._id,
                cloudinaryId: result.public_id
            });

            // Delete the local file after successful upload
            if (req.file && req.file.path) {
                fs.unlink(req.file.path, (err) => {
                    if (err) {
                        console.error('Error deleting local file:', err);
                        photographyLogger.error({
                            type: 'delete_local_file_error',
                            error: err.message,
                            stack: err.stack
                        });
                    } else {
                        console.log('Local file deleted successfully');
                        photographyLogger.info({
                            type: 'local_file_deleted',
                            filePath: req.file.path
                        });
                    }
                });
            }

            res.status(201).json(newPhotography);
        } catch (error) {
            console.error("Error during addPhotography:", error);
            photographyLogger.error({
                type: 'add_photography_error',
                error: error.message,
                stack: error.stack
            });
            res.status(500).json({ error: 'Error adding photography' });
        }
    },

    updatePhotography: async (req, res) => {
        try {
            const { id } = req.params;
            const updates = {
                name: req.body.name,
                description: req.body.description
            };            
    
            // If there's a new file, upload it to Cloudinary first
            if (req.file) {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'photography',    
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
                            photographyLogger.error({
                                type: 'delete_local_file_error',
                                error: err.message,
                                stack: err.stack
                            });
                        } else {
                            console.log('Local file deleted successfully');
                            photographyLogger.info({
                                type: 'local_file_deleted',
                                filePath: req.file.path
                            });
                        }
                    });
                }
            }
    
            const photography = await Photography.findByIdAndUpdate(id, updates, { new: true });
            if (!photography) {
                return res.status(404).json({ error: 'Photography not found' });
            }
    
            photographyLogger.info({
                type: 'photography_updated',
                photographyId: id
            });
            res.json(photography);
        } catch (error) {
            photographyLogger.error({
                type: 'update_photography_error',
                error: error.message
            });
            res.status(500).json({ error: 'Error updating photography' });
        }
    },

    deletePhotography: async (req, res) => {
        try {
            const { id } = req.params;
            
            // First, get the photography item to get the Cloudinary public_id
            const photography = await Photography.findById(id);
            if (!photography) {
                return res.status(404).json({ error: 'Photography not found' });
            }

            // Delete from Cloudinary first
            if (photography.filename) {
                await cloudinary.uploader.destroy(photography.filename);
                photographyLogger.info({
                    type: 'cloudinary_delete_success',
                    publicId: photography.filename
                });
            }

            // Then delete from database
            await Photography.findByIdAndDelete(id);

            photographyLogger.info({
                type: 'photography_deleted',
                photographyId: id
            });
            res.json({ message: 'Photography deleted successfully' });
        } catch (error) {
            photographyLogger.error({
                type: 'delete_photography_error',
                error: error.message
            });
            res.status(500).json({ error: 'Error deleting photography' });
        }
    }
};

module.exports = photographyController;