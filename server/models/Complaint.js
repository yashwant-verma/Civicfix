const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    citizen: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: { // Pothole, Garbage, Water Leak, etc.
        type: String,
        required: true,
    },
    image: { // Cloudinary URL
        type: String,
        required: true,
    },
    location: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        address: { type: String },
    },
    status: {
        type: String,
        enum: ['Registered', 'In Progress', 'Resolved', 'Rejected'],
        default: 'Registered',
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assigned officer/admin (optional)
    },
    resolutionDetails: {
        type: String,
    },
    resolvedAt: {
        type: Date,
    }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
