// File: api/complaints.js

import axiosInstance from "./axiosInstance";

// ✅ Citizen: Submit a new complaint
export const submitComplaint = async (formData) => {
    const response = await axiosInstance.post("/complaints/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

// ✅ Admin: Get all complaints
export const getAllComplaints = async () => {
    const response = await axiosInstance.get("/complaints/all");
    return response.data;
};

// ✅ Citizen: Get user’s own complaints
export const getMyComplaints = async () => {
    const response = await axiosInstance.get('/complaints/my-complaints');
    return response.data; // Returns { success: true, complaints: [...] }
};

// ✅ Admin: Update complaint status/resolution (Initial Admin Resolve)
// Data structure: { status, resolutionDetails }
export const updateComplaintStatus = async (complaintId, status, resolutionDetails) => {
    const response = await axiosInstance.put(`/complaints/${complaintId}/status`, {
        status,
        resolutionDetails,
    });
    return response.data;
};

// ✅ Admin: Admin Forward Complaint to Department Email
// Data structure: { targetEmail }
export const forwardComplaintEmail = async (complaintId, targetEmail) => {
    const response = await axiosInstance.post(`/complaints/${complaintId}/forward`, {
        targetEmail,
    });
    return response.data;
};

// ✅ Citizen Submit Verification of Resolution (Owner-Only, Auto-Complete)
export const submitVerification = async (complaintId, formData) => {
    const response = await axiosInstance.post(`/complaints/${complaintId}/verify`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

// ✅ ADMIN API: Get single citizen verification evidence (View Only)
export const getVerificationEvidence = async (complaintId, verificationId) => {
    const response = await axiosInstance.get(`/complaints/${complaintId}/verification/${verificationId}`);
    return response.data;
};
