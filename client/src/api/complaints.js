// File: api/complaints.js

import axiosInstance from "./axiosInstance";

// ✅ Citizen: Submit a new complaint
export const submitComplaint = async (formData) => {
    // FIX: Removed redundant '/v1'
    const response = await axiosInstance.post("/complaints/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

// ✅ Admin: Get all complaints
export const getAllComplaints = async () => {
    // FIX: Removed redundant '/v1'
    const response = await axiosInstance.get("/complaints/all");
    return response.data;
};

// ✅ Citizen: Get user’s own complaints
export const getMyComplaints = async () => {
    const response = await axiosInstance.get('/complaints/my-complaints');
    return response.data; // Returns { success: true, complaints: [...] }
};

// ✅ Admin: Update complaint status/resolution
export const updateComplaintStatus = async (complaintId, status, resolutionDetails) => {
    // FIX: Removed redundant '/v1' and corrected template literal usage
    const response = await axiosInstance.put(`/complaints/${complaintId}/status`, {
        status,
        resolutionDetails,
    });
    return response.data;
};

// 🚨 NEW FEATURE: Admin Forward Complaint to Department Email
export const forwardComplaintEmail = async (complaintId, targetEmail) => {
    const response = await axiosInstance.post(`/complaints/${complaintId}/forward`, {
        targetEmail,
    });
    return response.data;
};