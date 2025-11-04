// File: routes/complaintroutes.js

const express = require('express');
const {
    createComplaint,
    getMyComplaints,
    getAllComplaints,
    updateComplaintStatus,
    forwardComplaintEmail,
    submitVerification,
    getVerificationEvidence,
    verifyResolutionByAdmin, // Kept this function exported but disabled logic in controller
} = require('../controllers/complaintController');
const { auth, isAdmin, isCitizen } = require('../middleware/authMiddleware');

const router = express.Router();

// 🧾 Citizen routes
router.post('/create', auth, isCitizen, createComplaint);
router.get('/my-complaints', auth, isCitizen, getMyComplaints);
// CITIZEN VERIFICATION ROUTE 
router.post('/:complaintId/verify', auth, isCitizen, submitVerification);

// 🧑‍💼 Admin routes
router.get('/all', auth, isAdmin, getAllComplaints);
router.put('/:complaintId/status', auth, isAdmin, updateComplaintStatus);

// Admin Forward Complaint to Department Email
router.post('/:complaintId/forward', auth, isAdmin, forwardComplaintEmail);

// ADMIN ROUTE FOR VIEWING CITIZEN VERIFICATION EVIDENCE (View Only)
router.get('/:complaintId/verification/:verificationId', auth, isAdmin, getVerificationEvidence);

// Admin Finalization Route - Logic is disabled in the controller to enforce owner auto-complete
router.post('/:complaintId/admin-verify', auth, isAdmin, verifyResolutionByAdmin);

module.exports = router;
