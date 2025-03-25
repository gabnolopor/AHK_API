const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    cover: {
        type: String,
        required: false
    },
    genre: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    collection: 'Music'  
});

module.exports = mongoose.model('Music', musicSchema);