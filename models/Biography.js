const mongoose = require('mongoose');

const biographySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    }
}, {
    collection: 'Biography',
    timestamps: true
});

module.exports = mongoose.model('Biography', biographySchema);