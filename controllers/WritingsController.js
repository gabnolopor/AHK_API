const Writings = require('../models/Writings');
const { cloudinary } = require('../utils/cloudinary');
const { createModuleLogger } = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const writingsLogger = createModuleLogger('writings-controller');

const writingsController = {
    getAllWritings: async (req, res) => {
        try {
            const writings = await Writings.find({});
            
            // Transform the data to include correct Cloudinary URLs
            const writingsWithUrls = writings.map(writing => {
                const publicId = writing.filename;
                
                const imageUrl = cloudinary.url(publicId, {
                    cloud_name: process.env.CLOUDINARY_NAME,
                    resource_type: 'raw',
                    secure: true
                });

                return {
                    ...writing.toObject(),
                    imageUrl,
                    publicId
                };
            });

            console.log('Writings with URLs:', writingsWithUrls); // Debug log
            
            res.json(writingsWithUrls);
        } catch (error) {
            console.error('Error details:', error);
            writingsLogger.error({
                type: 'fetch_all_writings_error',
                error: error.message,
                stack: error.stack
            });
            res.status(500).json({ error: 'Error fetching writings' });
        }
    },

    getWritingById: async (req, res) => {
        try {
            const { id } = req.params;
            const writing = await Writings.findById(id);
            if (!writing) {
                return res.status(404).json({ error: 'Writing not found' });
            }
            writingsLogger.info({
                type: 'fetch_single_writing',
                writingId: id
            });
            res.json(writing);
        } catch (error) {
            writingsLogger.error({
                type: 'fetch_single_writing_error',
                error: error.message
            });
            res.status(500).json({ error: 'Error fetching writing' });
        }
    },

    addWriting: async (req, res) => {
        try {
            if (!req.file) {
                writingsLogger.error({
                    type: 'add_writing_error',
                    error: 'No file provided'
                });
                return res.status(400).json({ error: 'No file provided' });
            }

            // Upload to Cloudinary in writings folder
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'writings',    
                resource_type: 'raw',
                use_filename: true,
                unique_filename: true
            });

            writingsLogger.info({
                type: 'cloudinary_upload_success',
                publicId: result.public_id,
                url: result.secure_url
            });

            // Create new writing entry with Cloudinary data
            const newWriting = new Writings({
                filename: result.public_id,
                name: req.body.name,
                genre: req.body.genre  // Add genre
            });

            await newWriting.save();
            writingsLogger.info({
                type: 'writing_added',
                writingId: newWriting._id,
                cloudinaryId: result.public_id
            });

            // Delete the local file after successful upload
            if (req.file && req.file.path) {
                fs.unlink(req.file.path, (err) => {
                    if (err) {
                        console.error('Error deleting local file:', err);
                        writingsLogger.error({
                            type: 'delete_local_file_error',
                            error: err.message,
                            stack: err.stack
                        });
                    } else {
                        console.log('Local file deleted successfully');
                        writingsLogger.info({
                            type: 'local_file_deleted',
                            filePath: req.file.path
                        });
                    }
                });
            }

            res.status(201).json(newWriting);
        } catch (error) {
            writingsLogger.error({
                type: 'add_writing_error',
                error: error.message,
                stack: error.stack
            });
            res.status(500).json({ error: 'Error adding writing' });
        }
    },

    updateWriting: async (req, res) => {
        try {
            const { id } = req.params;
            const updates = {
                name: req.body.name,
                genre: req.body.genre  // Add genre
            };            

            // If there's a new file, upload it to Cloudinary first
            if (req.file) {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'writings',    
                    resource_type: 'raw',
                    use_filename: true,
                    unique_filename: true
                });

                // Update with new Cloudinary filename
                updates.filename = result.public_id;
            }

            const writing = await Writings.findByIdAndUpdate(id, updates, { new: true });
            if (!writing) {
                return res.status(404).json({ error: 'Writing not found' });
            }

            writingsLogger.info({
                type: 'writing_updated',
                writingId: id
            });
            res.json(writing);
        } catch (error) {
            writingsLogger.error({
                type: 'update_writing_error',
                error: error.message
            });
            res.status(500).json({ error: 'Error updating writing' });
        }
    },

    deleteWriting: async (req, res) => {
        try {
            const { id } = req.params;
            
            // First, get the writing item to get the Cloudinary public_id
            const writing = await Writings.findById(id);
            if (!writing) {
                return res.status(404).json({ error: 'Writing not found' });
            }

            // Delete from Cloudinary first
            if (writing.filename) {
                await cloudinary.uploader.destroy(writing.filename);
                writingsLogger.info({
                    type: 'cloudinary_delete_success',
                    publicId: writing.filename
                });
            }

            // Then delete from database
            await Writings.findByIdAndDelete(id);

            writingsLogger.info({
                type: 'writing_deleted',
                writingId: id
            });
            res.json({ message: 'Writing deleted successfully' });
        } catch (error) {
            writingsLogger.error({
                type: 'delete_writing_error',
                error: error.message
            });
            res.status(500).json({ error: 'Error deleting writing' });
        }
    }
};

module.exports = writingsController;