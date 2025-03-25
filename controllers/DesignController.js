const Design = require('../models/Design');
const { cloudinary } = require('../utils/cloudinary');
const { createModuleLogger } = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const designLogger = createModuleLogger('design-controller');

const designController = {
    getAllDesigns: async (req, res) => {
        try {
            const designs = await Design.find({});
            
            // Transform the data to include correct Cloudinary URLs
            const designsWithUrls = designs.map(design => {
                const publicId = design.filename;
                
                const imageUrl = cloudinary.url(publicId, {
                    cloud_name: process.env.CLOUDINARY_NAME,
                    secure: true
                });

                return {
                    ...design.toObject(),
                    imageUrl,
                    publicId
                };
            });

            console.log('Designs with URLs:', designsWithUrls); // Debug log
            
            res.json(designsWithUrls);
        } catch (error) {
            console.error('Error details:', error);
            designLogger.error({
                type: 'fetch_all_designs_error',
                error: error.message,
                stack: error.stack
            });
            res.status(500).json({ error: 'Error fetching designs' });
        }
    },

    getDesignById: async (req, res) => {
        try {
            const { id } = req.params;
            const design = await Design.findById(id);
            if (!design) {
                return res.status(404).json({ error: 'Design not found' });
            }
            designLogger.info({
                type: 'fetch_single_design',
                designId: id
            });
            res.json(design);
        } catch (error) {
            designLogger.error({
                type: 'fetch_single_design_error',
                error: error.message
            });
            res.status(500).json({ error: 'Error fetching design' });
        }
    },

    addDesign: async (req, res) => {
        try {
            console.log('File:', req.file);
            console.log('Name:', req.body.name);
            console.log('Description:', req.body.description);
    
            if (!req.file) {
                designLogger.error({
                    type: 'add_design_error',
                    error: 'No file provided'
                });
                return res.status(400).json({ error: 'No file provided' });
            }

            // Upload to Cloudinary in the 'designs' folder
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'designs',    
                resource_type: 'image',
                use_filename: true,
                unique_filename: true
            });

            designLogger.info({
                type: 'cloudinary_upload_success',
                publicId: result.public_id,
                url: result.secure_url
            });

            // Create new design entry with Cloudinary data
            const newDesign = new Design({
                filename: result.public_id,
                name: req.body.name,
                description: req.body.description
            });

            await newDesign.save();
            designLogger.info({
                type: 'design_added',
                designId: newDesign._id,
                cloudinaryId: result.public_id
            });

            // Delete the local file after successful upload
            if (req.file && req.file.path) {
                fs.unlink(req.file.path, (err) => {
                    if (err) {
                        console.error('Error deleting local file:', err);
                        designLogger.error({
                            type: 'delete_local_file_error',
                            error: err.message,
                            stack: err.stack
                        });
                    } else {
                        console.log('Local file deleted successfully');
                        designLogger.info({
                            type: 'local_file_deleted',
                            filePath: req.file.path
                        });
                    }
                });
            }

            res.status(201).json(newDesign);
        } catch (error) {
            console.error("Error during addDesign:", error);
            designLogger.error({
                type: 'add_design_error',
                error: error.message,
                stack: error.stack
            });
            res.status(500).json({ error: 'Error adding design' });
        }
    },

    updateDesign: async (req, res) => {
        try {
            const { id } = req.params;
            const updates = {
                name: req.body.name,
                description: req.body.description
            };            
    
            // If there's a new file, upload it to Cloudinary first
            if (req.file) {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'designs',    
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
                            designLogger.error({
                                type: 'delete_local_file_error',
                                error: err.message,
                                stack: err.stack
                            });
                        } else {
                            console.log('Local file deleted successfully');
                            designLogger.info({
                                type: 'local_file_deleted',
                                filePath: req.file.path
                            });
                        }
                    });
                }
            }
    
            const design = await Design.findByIdAndUpdate(id, updates, { new: true });
            if (!design) {
                return res.status(404).json({ error: 'Design not found' });
            }
    
            designLogger.info({
                type: 'design_updated',
                designId: id
            });
            res.json(design);
        } catch (error) {
            designLogger.error({
                type: 'update_design_error',
                error: error.message
            });
            res.status(500).json({ error: 'Error updating design' });
        }
    },

    deleteDesign: async (req, res) => {
        try {
            const { id } = req.params;
            
            // First, get the design item to get the Cloudinary public_id
            const design = await Design.findById(id);
            if (!design) {
                return res.status(404).json({ error: 'Design not found' });
            }

            // Delete from Cloudinary first
            if (design.filename) {
                await cloudinary.uploader.destroy(design.filename);
                designLogger.info({
                    type: 'cloudinary_delete_success',
                    publicId: design.filename
                });
            }

            // Then delete from database
            await Design.findByIdAndDelete(id);

            designLogger.info({
                type: 'design_deleted',
                designId: id
            });
            res.json({ message: 'Design deleted successfully' });
        } catch (error) {
            designLogger.error({
                type: 'delete_design_error',
                error: error.message
            });
            res.status(500).json({ error: 'Error deleting design' });
        }
    }
};

module.exports = designController;