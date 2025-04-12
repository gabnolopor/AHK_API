const mongoose = require('mongoose');

const digitalArtSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    imageUrl: {
        type: String,
        required: true
    },
}, {
    timestamps: true,
    collection: 'Digital'  
});

module.exports = mongoose.model('Digital', digitalArtSchema);