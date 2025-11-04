// File: models/complaint.js

const mongoose = require('mongoose');

// Define the structure for storing individual verification attempts by citizens
const verificationSchema = new mongoose.Schema({
    verifier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    isVerified: { // true for thumbs up (fixed), false for thumbs down (still broken)
        type: Boolean,
        required: true,
    },
    verificationImage: { // Photo proof of resolution (or lack thereof)
        type: String,
    },
    location: {
        latitude: { type: Number },
        longitude: { type: Number },
    },
    verifiedAt: {
        type: Date,
        default: Date.now,
    },
}, { /* Removed { _id: false } to enable automatic _id generation */ }); // FIX APPLIED HERE

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
    image: { // Original Complaint Image URL
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
        enum: ['Registered', 'In Progress', 'Resolved', 'Rejected', 'Verified Complete'],
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
    },
    // Simplified status for auto-complete: either Pending Owner Review, Verification Failed (rejected by owner), or Verified Complete
    verificationStatus: {
        type: String,
        enum: ['Not Applicable', 'Pending Owner Review', 'Verification Failed', 'Verified Complete'],
        default: 'Not Applicable',
    },
    verificationCount: { // Tracks if owner approved (max 1)
        type: Number,
        default: 0,
    },
    rejectionCount: { // Tracks if owner rejected (max 1)
        type: Number,
        default: 0,
    },
    verifications: [verificationSchema], // Stores the owner's single verification record
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);