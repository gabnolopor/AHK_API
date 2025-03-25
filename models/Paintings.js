const mongoose = require('mongoose');

const paintingsSchema = new mongoose.Schema({
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
    collection: 'Paintings'  // Changed to match the actual collection name case
});

module.exports = mongoose.model('Paintings', paintingsSchema);