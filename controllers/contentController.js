const Content = require('../models/Content');
const { createModuleLogger } = require('../utils/logger');
const path = require('path');

const contentLogger = createModuleLogger('content-controller');

const contentController = {
    // Get all content
    getAllContent: async (req, res) => {
        try {
            const content = await Content.find({});
            contentLogger.info({
                type: 'fetch_all_content',
                count: content.length
            });
            res.json(content);
        } catch (error) {
            contentLogger.error({
                type: 'fetch_all_content_error',
                error: error.message
            });
            res.status(500).json({ error: 'Error fetching content' });
        }
    },

    // Get content by category
    getContentByCategory: async (req, res) => {
        try {
            const { category } = req.params;
            const content = await Content.find({ category });
            contentLogger.info({
                type: 'fetch_category_content',
                category,
                count: content.length
            });
            res.json(content);
        } catch (error) {
            contentLogger.error({
                type: 'fetch_category_content_error',
                error: error.message
            });
            res.status(500).json({ error: 'Error fetching category content' });
        }
    },

    // Get single content item
    getContentById: async (req, res) => {
        try {
            const { id } = req.params;
            const content = await Content.findById(id);
            if (!content) {
                return res.status(404).json({ error: 'Content not found' });
            }
            contentLogger.info({
                type: 'fetch_single_content',
                contentId: id
            });
            res.json(content);
        } catch (error) {
            contentLogger.error({
                type: 'fetch_single_content_error',
                error: error.message
            });
            res.status(500).json({ error: 'Error fetching content' });
        }
    },

    // Add new content
    addContent: async (req, res) => {
        try {
            const { title, category, description, metadata } = req.body;
            const fileUrl = req.file ? `/public/uploads/${req.file.filename}` : null;

            if (!fileUrl) {
                return res.status(400).json({ error: 'File is required' });
            }

            const newContent = new Content({
                title,
                category,
                description,
                fileUrl,
                metadata: metadata ? JSON.parse(metadata) : {}
            });

            await newContent.save();
            contentLogger.info({
                type: 'content_added',
                contentId: newContent._id,
                category
            });
            res.status(201).json(newContent);
        } catch (error) {
            contentLogger.error({
                type: 'add_content_error',
                error: error.message
            });
            res.status(500).json({ error: 'Error adding content' });
        }
    },

    // Update content
    updateContent: async (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            if (req.file) {
                updates.fileUrl = `/public/uploads/${req.file.filename}`;
            }

            const content = await Content.findByIdAndUpdate(id, updates, { new: true });
            if (!content) {
                return res.status(404).json({ error: 'Content not found' });
            }

            contentLogger.info({
                type: 'content_updated',
                contentId: id
            });
            res.json(content);
        } catch (error) {
            contentLogger.error({
                type: 'update_content_error',
                error: error.message
            });
            res.status(500).json({ error: 'Error updating content' });
        }
    },

    // Delete content
    deleteContent: async (req, res) => {
        try {
            const { id } = req.params;
            const content = await Content.findByIdAndDelete(id);
            if (!content) {
                return res.status(404).json({ error: 'Content not found' });
            }

            contentLogger.info({
                type: 'content_deleted',
                contentId: id
            });
            res.json({ message: 'Content deleted successfully' });
        } catch (error) {
            contentLogger.error({
                type: 'delete_content_error',
                error: error.message
            });
            res.status(500).json({ error: 'Error deleting content' });
        }
    }
};

module.exports = contentController; 