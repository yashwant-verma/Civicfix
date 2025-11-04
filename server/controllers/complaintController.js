const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { uploadImageToCloudinary } = require('../utils/imageUploader');
// 🚨 IMPORTANT: The mail utility function is correctly imported
const { sendComplaintStatusUpdate, sendDepartmentForwardingEmail } = require('../utils/mailSender'); 
const path = require('path');
const fs = require('fs');

// 🧩 Citizen: Create a new complaint (Cloudinary + Local fallback)
exports.createComplaint = async (req, res) => {
    try {
        const { title, description, category, latitude, longitude, address } = req.body;
        const citizenId = req.user.id;

        console.log("Incoming complaint data:", req.body);

        // 🟡 Check file upload existence
        if (!req.files || !req.files.complaintImage) {
            return res.status(400).json({
                success: false,
                message: 'Complaint image is required.',
            });
        }

        const imageFile = req.files.complaintImage;

        // 🟡 Validate required fields
        if (!title || !description || !category || !latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'All required complaint fields are missing.',
            });
        }

        let imageUrl;

        try {
            // 🟢 Try Cloudinary upload
            const imageUploadResult = await uploadImageToCloudinary(
                imageFile,
                'CivicFix/Complaints'
            );

            imageUrl = imageUploadResult.secure_url;
            console.log('✅ Uploaded to Cloudinary:', imageUrl);

        } catch (cloudError) {
            console.warn('⚠️ Cloudinary upload failed, switching to local storage:', cloudError.message);

            // 🟠 Fallback: Save image locally
            const uploadDir = path.join(__dirname, '../uploads');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

            const fileExt = path.extname(imageFile.name || '.jpg'); // Default to .jpg if name is missing
            const fileName = `${Date.now()}_${Math.round(Math.random() * 1e6)}${fileExt}`;
            const filePath = path.join(uploadDir, fileName);

            // 🧩 express-fileupload adds tempFilePath only if `useTempFiles` = true
            if (imageFile.tempFilePath) {
                // Move temp file (if available)
                fs.renameSync(imageFile.tempFilePath, filePath);
            } else if (imageFile.data) {
                // Write buffer manually
                fs.writeFileSync(filePath, imageFile.data);
            } else {
                throw new Error('Invalid image file object: missing tempFilePath or data.');
            }

            // Ensure the host is correctly constructed for local access
            const host = req.get('host');
            const protocol = req.protocol;
            imageUrl = `${protocol}://${host}/uploads/${fileName}`;
            console.log('✅ Saved locally:', imageUrl);
        }

        // 🟣 Create complaint in DB
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

// 🧩 Admin: Get all complaints (for dashboard)
exports.getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({})
            .sort({ createdAt: -1 })
            .populate('citizen', 'name email');

        res.status(200).json({ success: true, complaints });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error fetching all complaints for admin.',
        });
    }
};

// 🧩 Admin: Update complaint status and resolution details
exports.updateComplaintStatus = async (req, res) => {
    try {
        const { complaintId } = req.params;
        const { status, resolutionDetails } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: 'New status is required.' });
        }

        // --- 🚨 BACKEND VALIDATION: ENFORCE NON-BLANK DESCRIPTION ---
        const requiresDescription = status !== 'Registered';
        const isBlank = !resolutionDetails || resolutionDetails.trim().length === 0;

        if (requiresDescription && isBlank) {
            return res.status(400).json({
                success: false,
                message: `Resolution details are mandatory and cannot be left blank for status: ${status}.`,
            });
        }
        // -------------------------------------------------------------

        const complaint = await Complaint.findById(complaintId);
        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found.' });
        }

        const updateFields = { status };

        if (resolutionDetails && resolutionDetails.trim().length > 0) {
            updateFields.resolutionDetails = resolutionDetails.trim();
        } 

        // Handle resolvedAt timestamp
        if (status === 'Resolved') {
            updateFields.resolvedAt = new Date();
        } else {
            updateFields.resolvedAt = null; 
        }

        const updatedComplaint = await Complaint.findByIdAndUpdate(
            complaintId,
            { $set: updateFields },
            { new: true }
        ).populate('citizen', 'name email');

        const citizen = await User.findById(updatedComplaint.citizen);
        if (citizen) {
            if (complaint.status !== updatedComplaint.status) {
                sendComplaintStatusUpdate(citizen.email, updatedComplaint._id, updatedComplaint.status);
            }
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

// 🚨 NEW FEATURE: Admin Forward Complaint to Specific Department 🚨
exports.forwardComplaintEmail = async (req, res) => {
    const { complaintId } = req.params; 
    const { targetEmail } = req.body;

    if (!targetEmail) {
        return res.status(400).json({ success: false, message: 'Target department email is required for forwarding.' });
    }

    try {
        // 1. Fetch Complaint Details (Populate citizen for contact info)
        const complaint = await Complaint.findById(complaintId).populate('citizen', 'name email phone'); 

        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found.' });
        }

        // 2. Use the mail sender utility to send the detailed email
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