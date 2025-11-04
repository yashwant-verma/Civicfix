// File: controllers/complaintController.js

const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { uploadImageToCloudinary } = require('../utils/imageUploader'); 
const { sendComplaintStatusUpdate, sendDepartmentForwardingEmail } = require('../utils/mailSender');
const path = require('path');
const fs = require('fs');

// Helper function to safely remove local files (if file upload fallback was used)
const safeUnlink = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch (e) {
            console.warn(`Failed to unlink file at: ${filePath}`, e);
        }
    }
};

// 🧩 Citizen: Create a new complaint
exports.createComplaint = async (req, res) => {
    try {
        const { title, description, category, latitude, longitude, address } = req.body;
        const citizenId = req.user.id;

        console.log("Incoming complaint data:", req.body);

        if (!req.files || !req.files.complaintImage) {
            return res.status(400).json({
                success: false,
                message: 'Complaint image is required.',
            });
        }

        const imageFile = req.files.complaintImage;
        const folderName = 'CivicFix/Complaints'; 

        if (!title || !description || !category || !latitude || !longitude || !address) {
            if (imageFile.tempFilePath) safeUnlink(imageFile.tempFilePath);
            return res.status(400).json({
                success: false,
                message: 'All required complaint fields are missing (Title, Description, Category, Location, Address).',
            });
        }

        let imageUrl;

        try {
            const imageUploadResult = await uploadImageToCloudinary(imageFile, folderName);
            imageUrl = imageUploadResult.url;
            console.log('✅ Uploaded to Cloudinary:', imageUrl);
            if (imageFile.tempFilePath) safeUnlink(imageFile.tempFilePath);

        } catch (cloudError) {
            console.warn('⚠️ Cloudinary upload failed, switching to local storage:', cloudError.message);
            const uploadDir = path.join(__dirname, '../uploads');
            const complaintUploadDir = path.join(uploadDir, folderName);
            if (!fs.existsSync(complaintUploadDir)) fs.mkdirSync(complaintUploadDir, { recursive: true });

            const fileExt = path.extname(imageFile.name || '.jpg');
            const fileName = `${Date.now()}_${Math.round(Math.random() * 1e6)}${fileExt}`;
            const filePath = path.join(complaintUploadDir, fileName); 

            try {
                await imageFile.mv(filePath); 
                const host = req.get('host');
                const protocol = req.protocol;
                imageUrl = `${protocol}://${host}/uploads/${folderName}/${fileName}`; 
                console.log('✅ Saved locally:', imageUrl);

            } catch (localError) {
                console.error('❌ FATAL: Local storage fallback also failed:', localError);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to upload complaint image using local fallback.'
                });
            }
        }

        const newComplaint = await Complaint.create({
            citizen: citizenId,
            title,
            description,
            category,
            image: imageUrl, 
            location: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                address,
            },
            status: 'Registered',
            verificationStatus: 'Not Applicable',
        });

        res.status(201).json({
            success: true,
            message: 'Complaint registered successfully.',
            complaint: newComplaint,
        });

    } catch (error) {
        console.error('❌ Error creating complaint:', error);
        res.status(500).json({
            success: false,
            message: 'Could not create complaint.',
            error: error.message,
        });
    }
};

// 🧩 Citizen: Get all complaints by the user
exports.getMyComplaints = async (req, res) => {
    try {
        console.log("Fetching complaints for citizen:", req.user.id);
        const complaints = await Complaint.find({ citizen: req.user.id }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            complaints: complaints || [],
            message: complaints.length
                ? 'Complaints fetched successfully.'
                : 'No complaints found for this user.',
        });
    } catch (error) {
        console.error("Error fetching complaints:", error);
        res.status(500).json({
            success: false,
            message: "Server error fetching complaints.",
            error: error.message,
        });
    }
};

// 🧩 Admin: Get all complaints
exports.getAllComplaints = async (req, res) => {
    let complaints;
    try {
        // Populate citizen details (name, email)
        complaints = await Complaint.find({}).sort({ createdAt: -1 }).populate('citizen', 'name email');
        
        res.status(200).json({ success: true, complaints });
    } catch (error) {
        console.error("CRITICAL ADMIN FETCH ERROR:", error); 
        res.status(500).json({
            success: false,
            message: 'Error fetching all complaints for admin.',
        });
    }
};

// 🧩 Admin: Update complaint status and resolution details
// File: controllers/complaintController.js

// ... (other exports)

// 🧩 Admin: Update complaint status and resolution details
// File: controllers/complaintController.js (Update this function only)

// 🧩 Admin: Update complaint status and resolution details
// File: controllers/complaintController.js (Update this function only)

// 🧩 Admin: Update complaint status and resolution details
exports.updateComplaintStatus = async (req, res) => {
    try {
        const { complaintId } = req.params;
        const { status, resolutionDetails } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: 'New status is required.' });
        }
        
        // Find the complaint first to check its current state
        const complaint = await Complaint.findById(complaintId);
        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found.' });
        }

        // CRITICAL FIX: Block status update if the complaint is already Verified Complete
        if (complaint.status === 'Verified Complete') {
            return res.status(403).json({ 
                success: false, 
                message: 'Complaint is Verified Complete by the citizen and cannot be modified by Admin.' 
            });
        }
        
        // --- Remaining logic remains similar to previous version ---

        // 1. Block admin from setting *to* Verified Complete (Security Layer)
        if (status === 'Verified Complete') {
            return res.status(403).json({ 
                success: false, 
                message: 'Admin cannot set status directly to "Verified Complete". This status is set only by the original citizen via verification.' 
            });
        }
        
        // --- Validation for Resolution Details ---
        const requiresDescription = status !== 'Registered';
        const isBlank = !resolutionDetails || resolutionDetails.trim().length === 0;

        if (requiresDescription && isBlank) {
            return res.status(400).json({
                success: false,
                message: `Resolution details are mandatory and cannot be left blank for status: ${status}.`,
            });
        }
        
        let updateFields = { status, resolutionDetails: resolutionDetails ? resolutionDetails.trim() : null };

        if (status === 'Resolved') {
            updateFields.resolvedAt = new Date();
            // Set to Pending Owner Review 
            updateFields.verificationStatus = 'Pending Owner Review';
            // Reset verification counts for a new cycle
            updateFields.verificationCount = 0;
            updateFields.rejectionCount = 0;
            updateFields.verifications = [];

        } else {
            updateFields.resolvedAt = null;
            // Clear verification fields if status moves away from Resolved
            if (status !== 'Resolved') {
                updateFields.verificationStatus = 'Not Applicable';
                updateFields.verificationCount = 0;
                updateFields.rejectionCount = 0;
                updateFields.verifications = [];
            }
        }
        
        const updatedComplaint = await Complaint.findByIdAndUpdate(
            complaintId,
            { $set: updateFields },
            { new: true }
        ).populate('citizen', 'name email');

        // Send email notification (optional logic)
        const citizen = await User.findById(updatedComplaint.citizen);
        if (citizen && complaint.status !== updatedComplaint.status) {
            // function definition remains outside this scope
        }

        res.status(200).json({
            success: true,
            message: `Complaint status updated to ${updatedComplaint.status}.`,
            complaint: updatedComplaint,
        });

    } catch (error) {
        console.error("Server error updating complaint status:", error);
        res.status(500).json({
            success: false,
            message: 'Server error updating complaint status.',
            error: error.message,
        });
    }
};

// 🧩 Admin: Forward Complaint to Specific Department (UNCHANGED)
exports.forwardComplaintEmail = async (req, res) => {
    const { complaintId } = req.params;
    const { targetEmail } = req.body;

    if (!targetEmail) {
        return res.status(400).json({ success: false, message: 'Target department email is required for forwarding.' });
    }

    try {
        const complaint = await Complaint.findById(complaintId).populate('citizen', 'name email phone');

        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found.' });
        }

        // Assuming sendDepartmentForwardingEmail function exists and works
        await sendDepartmentForwardingEmail(targetEmail, complaint);

        console.log(`✅ Complaint ${complaintId} successfully forwarded to ${targetEmail}`);

        res.status(200).json({
            success: true,
            message: `Complaint successfully forwarded to ${targetEmail}.`,
            complaint: complaint
        });

    } catch (error) {
        console.error('❌ Error forwarding complaint email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to forward complaint via email. Check mail sender configuration.',
            error: error.message,
        });
    }
};

// 🧩 Admin: Get verification evidence (View Only)
exports.getVerificationEvidence = async (req, res) => {
    try {
        const { complaintId, verificationId } = req.params;

        // Populate verifier name for context
        const complaint = await Complaint.findById(complaintId).populate('verifications.verifier', 'name');
        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found.' });
        }

        // Find the specific verification record (which should be the owner's single review)
        // This line requires the verification sub-document to have a generated _id.
        const verification = complaint.verifications.id(verificationId);
        if (!verification) {
            return res.status(404).json({ success: false, message: 'Verification record not found.' });
        }

        return res.status(200).json({
            success: true,
            verification,
            complaintTitle: complaint.title,
            complaintStatus: complaint.status,
        });

    } catch (error) {
        console.error('Server error fetching verification evidence:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching verification evidence.',
            error: error.message,
        });
    }
};

// 🚨 REMOVED/DISABLED: Admin Finalize Verification (No admin role in final status)
exports.verifyResolutionByAdmin = async (req, res) => {
    return res.status(403).json({ success: false, message: 'Final admin verification is disabled. The owner\'s verification is final.' });
};


// 🧩 CRITICAL LOGIC: Citizen Submit Verification (ONLY OWNER, AUTO-COMPLETE) 
exports.submitVerification = async (req, res) => {
    const { complaintId } = req.params;
    const { isVerified: isVerifiedString, latitude, longitude } = req.body; 
    const verifierId = req.user.id; 
    const isCitizen = req.user.role === 'citizen';

    if (!isCitizen) {
        return res.status(403).json({ success: false, message: 'Only citizens can verify complaints.' });
    }

    let verificationImageUrl = null;
    let imageFile = req.files ? req.files.verificationImage : null;
    const folderName = 'CivicFix/Verification';

    if (!imageFile) {
        return res.status(400).json({ success: false, message: 'Verification photo proof is required.' });
    }

    // --- Image Upload Logic ---
    try {
        const imageUploadResult = await uploadImageToCloudinary(imageFile, folderName);
        verificationImageUrl = imageUploadResult.url;
        if (imageFile.tempFilePath) safeUnlink(imageFile.tempFilePath);
    } catch (cloudError) {
        console.warn('⚠️ Cloudinary upload failed, switching to local storage:', cloudError.message);
        // Local storage fallback logic (omitted for brevity, assume functional)
        const uploadDir = path.join(__dirname, '../uploads');
        const verificationUploadDir = path.join(uploadDir, folderName);
        if (!fs.existsSync(verificationUploadDir)) fs.mkdirSync(verificationUploadDir, { recursive: true });
        const fileExt = path.extname(imageFile.name || '.jpg');
        const fileName = `verification_${Date.now()}_${Math.round(Math.random() * 1e6)}${fileExt}`;
        const filePath = path.join(verificationUploadDir, fileName);
        try {
             imageFile.mv(filePath); 
             const host = req.get('host');
             const protocol = req.protocol;
             verificationImageUrl = `${protocol}://${host}/uploads/${folderName}/${fileName}`;
        } catch (localError) {
             console.error('❌ FATAL: Local storage fallback also failed:', localError);
             return res.status(500).json({ success: false, message: 'Failed to upload verification image using local fallback.' });
        }
    }
    // --- End Image Upload Logic ---

    if (isVerifiedString === undefined || !verifierId || !latitude || !longitude) {
        return res.status(400).json({ success: false, message: 'Verification status, location, and user ID are required.' });
    }

    try {
        const complaint = await Complaint.findById(complaintId);
        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found.' });
        }

        // 1. CRITICAL: Check if the submitter is the ORIGINAL COMPLAINT OWNER
        if (complaint.citizen.toString() !== verifierId) {
            return res.status(403).json({ success: false, message: 'Only the original complaint submitter can verify the resolution status.' });
        }

        // 2. Check if the complaint is eligible for verification
        if (complaint.status !== 'Resolved') {
            return res.status(400).json({ success: false, message: 'Complaint must be in "Resolved" status to be verified.' });
        }

        // 3. Ensure they haven't verified already
        if (complaint.verifications.length > 0) {
            return res.status(400).json({ success: false, message: 'You have already submitted your final verification for this complaint.' });
        }

        // 4. Create new verification record
        const isConfirmed = isVerifiedString === 'true'; 
        const newVerification = {
            verifier: verifierId,
            isVerified: isConfirmed,
            verificationImage: verificationImageUrl,
            location: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) }
        };

        // 5. Determine Final Status (AUTO-COMPLETE/Owner is Final Authority)
        // If confirmed, status becomes 'Verified Complete'. If rejected, status becomes 'Verification Failed'.
        const newStatus = isConfirmed ? 'Verified Complete' : 'Resolved'; 
        const newVerificationStatus = isConfirmed ? 'Verified Complete' : 'Verification Failed';

        let updatedComplaint = await Complaint.findByIdAndUpdate(
            complaintId,
            { 
                $set: { 
                    status: newStatus, // Main status update by owner
                    verificationStatus: newVerificationStatus,
                    verificationCount: isConfirmed ? 1 : 0, 
                    rejectionCount: isConfirmed ? 0 : 1, 
                },
                $push: { verifications: newVerification } 
            },
            { new: true }
        );

        // 6. Send email update 
        const citizen = await User.findById(updatedComplaint.citizen);
        if (citizen) {
             sendComplaintStatusUpdate(citizen.email, updatedComplaint._id, updatedComplaint.status);
        }

        // 7. Success Response
        return res.status(200).json({
            success: true,
            message: isConfirmed ? 'Resolution confirmed! Complaint marked as Verified Complete.' : 'Resolution rejected. Complaint status remains Resolved for admin review.',
            complaint: updatedComplaint,
        });

    } catch (error) {
        console.error('❌ Server error processing owner verification:', error);
        res.status(500).json({
            success: false,
            message: 'Server error processing verification or database query failed.',
            error: error.message,
        });
    }
};

module.exports = exports;
