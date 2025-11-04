const express = require('express');
const {
    createComplaint,
    getMyComplaints,
    getAllComplaints,
    updateComplaintStatus,
    // Ensure this new function is exported in your complaintController.js
    forwardComplaintEmail, 
} = require('../controllers/complaintController');
const { auth, isAdmin, isCitizen } = require('../middleware/authMiddleware');

const router = express.Router();

// 🧾 Citizen routes
router.post('/create', auth, isCitizen, createComplaint);
router.get('/my-complaints', auth, isCitizen, getMyComplaints);

// 🧑‍💼 Admin routes
router.get('/all', auth, isAdmin, getAllComplaints);
router.put('/:complaintId/status', auth, isAdmin, updateComplaintStatus);

// 🚨 NEW FEATURE: Admin Forward Complaint to Department Email
// Route: POST /api/complaints/:complaintId/forward
router.post('/:complaintId/forward', auth, isAdmin, forwardComplaintEmail);

module.exports = router;