const mongoose = require('mongoose');

const designSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    filename: {
        type: String,
        required: true
    },
}, {
    timestamps: true,
    collection: 'Designs'  // Ensure the collection name matches your database
});

module.exports = mongoose.model('Design', designSchema);