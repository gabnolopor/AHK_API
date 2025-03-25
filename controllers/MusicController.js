const Music = require('../models/Music');
const { cloudinary } = require('../utils/cloudinary');
const { createModuleLogger } = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const musicLogger = createModuleLogger('music-controller');

const musicController = {
    getAllMusic: async (req, res) => {
        try {
            const music = await Music.find({});
            
            // Transform the data to include correct Cloudinary URLs
            const musicWithUrls = music.map(track => {
                const publicId = track.filename;
                
                const imageUrl = cloudinary.url(publicId, {
                    cloud_name: process.env.CLOUDINARY_NAME,
                    resource_type: 'video',
                    secure: true
                });

                return {
                    ...track.toObject(),
                    imageUrl,
                    publicId
                };
            });

            console.log('Music with URLs:', musicWithUrls); // Debug log
            
            res.json(musicWithUrls);
        } catch (error) {
            console.error('Error details:', error);
            musicLogger.error({
                type: 'fetch_all_music_error',
                error: error.message,
                stack: error.stack
            });
            res.status(500).json({ error: 'Error fetching music' });
        }
    },

    getMusicById: async (req, res) => {
        try {
            const { id } = req.params;
            const music = await Music.findById(id);
            if (!music) {
                return res.status(404).json({ error: 'Music not found' });
            }
            musicLogger.info({
                type: 'fetch_single_music',
                musicId: id
            });
            res.json(music);
        } catch (error) {
            musicLogger.error({
                type: 'fetch_single_music_error',
                error: error.message
            });
            res.status(500).json({ error: 'Error fetching music' });
        }
    },

    addMusic: async (req, res) => {
        try {
            if (!req.file) {
                musicLogger.error({
                    type: 'add_music_error',
                    error: 'No file provided'
                });
                return res.status(400).json({ error: 'No file provided' });
            }

            // Upload to Cloudinary in music folder
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'music',    
                resource_type: 'video',  // Use 'video' for audio files
                use_filename: true,
                unique_filename: true
            });

            musicLogger.info({
                type: 'cloudinary_upload_success',
                publicId: result.public_id,
                url: result.secure_url
            });

            // Create new music entry with Cloudinary data and genre
            const newMusic = new Music({
                filename: result.public_id,
                name: req.body.name,
                genre: req.body.genre  // Add genre
            });

            await newMusic.save();
            musicLogger.info({
                type: 'music_added',
                musicId: newMusic._id,
                cloudinaryId: result.public_id
            });

            // Delete the local file after successful upload
            if (req.file && req.file.path) {
                fs.unlink(req.file.path, (err) => {
                    if (err) {
                        console.error('Error deleting local file:', err);
                        musicLogger.error({
                            type: 'delete_local_file_error',
                            error: err.message,
                            stack: err.stack
                        });
                    } else {
                        console.log('Local file deleted successfully');
                        musicLogger.info({
                            type: 'local_file_deleted',
                            filePath: req.file.path
                        });
                    }
                });
            }

            res.status(201).json(newMusic);
        } catch (error) {
            musicLogger.error({
                type: 'add_music_error',
                error: error.message,
                stack: error.stack
            });
            res.status(500).json({ error: 'Error adding music' });
        }
    },

    updateMusic: async (req, res) => {
        try {
            const { id } = req.params;
            const updates = {
                name: req.body.name,
                genre: req.body.genre
            };            

            // If there's a new file, upload it to Cloudinary first
            if (req.file) {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'music',    
                    resource_type: 'video',  // Use 'video' for audio files
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
                            musicLogger.error({
                                type: 'delete_local_file_error',
                                error: err.message,
                                stack: err.stack
                            });
                        } else {
                            console.log('Local file deleted successfully');
                            musicLogger.info({
                                type: 'local_file_deleted',
                                filePath: req.file.path
                            });
                        }
                    });
                }
            }

            const music = await Music.findByIdAndUpdate(id, updates, { new: true });
            if (!music) {
                return res.status(404).json({ error: 'Music not found' });
            }

            musicLogger.info({
                type: 'music_updated',
                musicId: id
            });
            res.json(music);
        } catch (error) {
            musicLogger.error({
                type: 'update_music_error',
                error: error.message
            });
            res.status(500).json({ error: 'Error updating music' });
        }
    },

    deleteMusic: async (req, res) => {
        try {
            const { id } = req.params;
            
            // First, get the music item to get the Cloudinary public_id
            const music = await Music.findById(id);
            if (!music) {
                return res.status(404).json({ error: 'Music not found' });
            }

            // Delete from Cloudinary first
            if (music.filename) {
                await cloudinary.uploader.destroy(music.filename, { resource_type: 'video' });
                musicLogger.info({
                    type: 'cloudinary_delete_success',
                    publicId: music.filename
                });
            }

            // Then delete from database
            await Music.findByIdAndDelete(id);

            musicLogger.info({
                type: 'music_deleted',
                musicId: id
            });
            res.json({ message: 'Music deleted successfully' });
        } catch (error) {
            musicLogger.error({
                type: 'delete_music_error',
                error: error.message
            });
            res.status(500).json({ error: 'Error deleting music' });
        }
    }
};

module.exports = musicController;