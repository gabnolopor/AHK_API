const DigitalArt = require('../models/DigitalArt');
const { cloudinary } = require('../utils/cloudinary');
const { createModuleLogger } = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const digitalArtLogger = createModuleLogger('digital-art-controller');

const digitalArtController = {
    getAllDigitalArt: async (req, res) => {
        try {
            const digitalArt = await DigitalArt.find({});
            
            // Transform the data to include correct Cloudinary URLs
            const digitalArtWithUrls = digitalArt.map(art => {
                const publicId = art.imageUrl;
                
                const imageUrl = cloudinary.url(publicId, {
                    cloud_name: process.env.CLOUDINARY_NAME,
                    secure: true
                });

                return {
                    ...art.toObject(),
                    imageUrl,
                    publicId
                };
            });

            digitalArtLogger.info({
                type: 'fetch_all_digital_art',
                count: digitalArtWithUrls.length
            });
            
            res.json(digitalArtWithUrls);
        } catch (error) {
            console.error('Error in getAllDigitalArt:', error);
            digitalArtLogger.error({
                type: 'fetch_all_digital_art_error',
                error: error.message,
                stack: error.stack
            });
            res.status(500).json({ error: 'Error fetching digital art' });
        }
    },

    getDigitalArtById: async (req, res) => {
        try {
            const digitalArt = await DigitalArt.findById(req.params.id);
            if (!digitalArt) {
                digitalArtLogger.warn({
                    type: 'digital_art_not_found',
                    artId: req.params.id
                });
                return res.status(404).json({ error: 'Digital art not found' });
            }
            
            digitalArtLogger.info({
                type: 'fetch_single_digital_art',
                artId: req.params.id
            });
            
            res.json(digitalArt);
        } catch (error) {
            console.error('Error in getDigitalArtById:', error);
            digitalArtLogger.error({
                type: 'fetch_single_digital_art_error',
                error: error.message,
                stack: error.stack
            });
            res.status(500).json({ error: 'Error fetching digital art' });
        }
    },

    createDigitalArt: async (req, res) => {
        try {
            console.log('File:', req.file);
            console.log('Title:', req.body.title);
            console.log('Description:', req.body.description);
            
            if (!req.file && !req.body.imageUrl) {
                digitalArtLogger.error({
                    type: 'create_digital_art_error',
                    error: 'No image provided'
                });
                return res.status(400).json({ error: 'No image provided' });
            }

            let imageUrl;
            
            // Upload to Cloudinary if file is provided
            if (req.file) {
                // Upload to Cloudinary in the 'digital-art' folder
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'digital-art',    
                    resource_type: 'image',
                    use_filename: true,
                    unique_filename: true
                });

                digitalArtLogger.info({
                    type: 'cloudinary_upload_success',
                    publicId: result.public_id,
                    url: result.secure_url
                });
                
                imageUrl = result.public_id;
                
                // Delete the local file after successful upload
                if (req.file.path) {
                    fs.unlink(req.file.path, (err) => {
                        if (err) {
                            console.error('Error deleting local file:', err);
                            digitalArtLogger.error({
                                type: 'delete_local_file_error',
                                error: err.message,
                                stack: err.stack
                            });
                        } else {
                            console.log('Local file deleted successfully');
                            digitalArtLogger.info({
                                type: 'local_file_deleted',
                                filePath: req.file.path
                            });
                        }
                    });
                }
            } else {
                imageUrl = req.body.imageUrl;
            }

            const digitalArt = new DigitalArt({
                title: req.body.title,
                description: req.body.description,
                imageUrl: imageUrl
            });

            const savedDigitalArt = await digitalArt.save();
            
            digitalArtLogger.info({
                type: 'digital_art_created',
                artId: savedDigitalArt._id,
                title: savedDigitalArt.title
            });
            
            res.status(201).json(savedDigitalArt);
        } catch (error) {
            console.error('Error in createDigitalArt:', error);
            digitalArtLogger.error({
                type: 'create_digital_art_error',
                error: error.message,
                stack: error.stack
            });
            res.status(500).json({ error: 'Error creating digital art' });
        }
    },

    updateDigitalArt: async (req, res) => {
        try {
            const digitalArt = await DigitalArt.findById(req.params.id);
            if (!digitalArt) {
                digitalArtLogger.warn({
                    type: 'digital_art_not_found',
                    artId: req.params.id
                });
                return res.status(404).json({ error: 'Digital art not found' });
            }

            const updates = {
                title: req.body.title || digitalArt.title,
                description: req.body.description || digitalArt.description
            };
            
            // If there's a new file, upload it to Cloudinary first
            if (req.file) {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'digital-art',    
                    resource_type: 'image',
                    use_filename: true,
                    unique_filename: true
                });
                
                digitalArtLogger.info({
                    type: 'cloudinary_upload_success',
                    publicId: result.public_id,
                    url: result.secure_url
                });
                
                // Update with new Cloudinary filename
                updates.imageUrl = result.public_id;
                
                // Delete the local file after successful upload
                if (req.file.path) {
                    fs.unlink(req.file.path, (err) => {
                        if (err) {
                            console.error('Error deleting local file:', err);
                            digitalArtLogger.error({
                                type: 'delete_local_file_error',
                                error: err.message,
                                stack: err.stack
                            });
                        } else {
                            console.log('Local file deleted successfully');
                            digitalArtLogger.info({
                                type: 'local_file_deleted',
                                filePath: req.file.path
                            });
                        }
                    });
                }
                
                // Delete old image from Cloudinary if it exists
                if (digitalArt.imageUrl && digitalArt.imageUrl.startsWith('digital-art/')) {
                    try {
                        await cloudinary.uploader.destroy(digitalArt.imageUrl);
                        digitalArtLogger.info({
                            type: 'cloudinary_delete_success',
                            publicId: digitalArt.imageUrl
                        });
                    } catch (cloudinaryError) {
                        digitalArtLogger.error({
                            type: 'cloudinary_delete_error',
                            error: cloudinaryError.message,
                            publicId: digitalArt.imageUrl
                        });
                    }
                }
            }

            const updatedDigitalArt = await DigitalArt.findByIdAndUpdate(
                req.params.id, 
                updates, 
                { new: true }
            );
            
            digitalArtLogger.info({
                type: 'digital_art_updated',
                artId: updatedDigitalArt._id,
                title: updatedDigitalArt.title
            });
            
            res.json(updatedDigitalArt);
        } catch (error) {
            console.error('Error in updateDigitalArt:', error);
            digitalArtLogger.error({
                type: 'update_digital_art_error',
                error: error.message,
                stack: error.stack
            });
            res.status(500).json({ error: 'Error updating digital art' });
        }
    },

    deleteDigitalArt: async (req, res) => {
        try {
            const digitalArt = await DigitalArt.findById(req.params.id);
            if (!digitalArt) {
                digitalArtLogger.warn({
                    type: 'digital_art_not_found',
                    artId: req.params.id
                });
                return res.status(404).json({ error: 'Digital art not found' });
            }

            // Delete from Cloudinary first if the image is stored there
            if (digitalArt.imageUrl && digitalArt.imageUrl.startsWith('digital-art/')) {
                try {
                    await cloudinary.uploader.destroy(digitalArt.imageUrl);
                    digitalArtLogger.info({
                        type: 'cloudinary_delete_success',
                        publicId: digitalArt.imageUrl
                    });
                } catch (cloudinaryError) {
                    digitalArtLogger.error({
                        type: 'cloudinary_delete_error',
                        error: cloudinaryError.message,
                        publicId: digitalArt.imageUrl
                    });
                }
            }

            // Then delete from database
            await DigitalArt.findByIdAndDelete(req.params.id);
            
            digitalArtLogger.info({
                type: 'digital_art_deleted',
                artId: req.params.id
            });
            
            res.json({ message: 'Digital art deleted successfully' });
        } catch (error) {
            console.error('Error in deleteDigitalArt:', error);
            digitalArtLogger.error({
                type: 'delete_digital_art_error',
                error: error.message,
                stack: error.stack
            });
            res.status(500).json({ error: 'Error deleting digital art' });
        }
    }
};

module.exports = digitalArtController;