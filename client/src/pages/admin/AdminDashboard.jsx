// File: src/pages/admin/AdminDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import * as api from '../../api/complaints'; 
import { useAuth } from '../../context/AuthContext'; 
import { Loader2, Zap, Settings, XCircle, CheckCircle, Clock, Mail, ThumbsUp, ThumbsDown, Image as ImageIcon, Globe, ShieldCheck, RefreshCcw } from 'lucide-react'; 

const STATUS_OPTIONS = ['Registered', 'In Progress', 'Resolved', 'Rejected'];
const FILTER_OPTIONS = ['All', ...STATUS_OPTIONS, 'Verified Complete'];

const DEPARTMENT_OPTIONS = [
    { name: 'Public Works Dept', email: 'works@city.gov' },
    { name: 'Sanitation Dept', email: 'sanitation@city.gov' },
    { name: 'Traffic & Transport', email: 'traffic@city.gov' },
    { name: 'Electrical/Lighting', email: 'electric@city.gov' },
    { name: 'Parks & Recreation', email: 'parks@city.gov' },
    { name: 'Citizen Services', email: 'services@city.gov' },
    { name: 'Police Department', email: 'police@city.gov' },
    { name: 'Fire & Safety', email: 'fire@city.gov' },
];

const ComplaintStatusBadge = ({ status }) => {
    const statusClasses = {
        Registered: 'bg-yellow-100 text-yellow-800 border-yellow-500',
        'In Progress': 'bg-blue-100 text-blue-800 border-blue-500',
        Resolved: 'bg-green-100 text-green-800 border-green-500',
        Rejected: 'bg-red-100 text-red-800 border-red-500',
        'Verified Complete': 'bg-purple-100 text-purple-800 border-purple-500',
    };
    return (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusClasses[status] || 'bg-gray-100 text-gray-800 border-gray-500'}`}>
            {status}
        </span>
    );
};

const StatusCounts = ({ data }) => {
    const counts = data.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
    }, {});

    const cards = [
        { title: 'Total', status: 'All', value: data.length, icon: <Zap className="h-6 w-6 text-red-500" />, color: 'border-red-500' },
        { title: 'Registered', status: 'Registered', value: counts['Registered'] || 0, icon: <Clock className="h-6 w-6 text-yellow-500" />, color: 'border-yellow-500' },
        { title: 'In Progress', status: 'In Progress', value: counts['In Progress'] || 0, icon: <Settings className="h-6 w-6 text-blue-500" />, color: 'border-blue-500' },
        { title: 'Resolved', status: 'Resolved', value: counts['Resolved'] || 0, icon: <CheckCircle className="h-6 w-6 text-green-500" />, color: 'border-green-500' },
        { title: 'Verified Complete', status: 'Verified Complete', value: counts['Verified Complete'] || 0, icon: <ShieldCheck className="h-6 w-6 text-purple-500" />, color: 'border-purple-500' },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {cards.map(card => (
                <div key={card.title} className={`bg-white p-4 rounded-xl shadow-lg border-l-4 ${card.color} flex items-center justify-between`}>
                    <div>
                        <p className="text-sm font-medium text-gray-500">{card.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${card.color.replace('border-l-4 border-', 'bg-')}`}>
                        {React.cloneElement(card.icon, { className: 'h-6 w-6 text-white' })} 
                    </div>
                </div>
            ))}
        </div>
    );
};

// 🚨 ADMIN VIEW ONLY MODAL: Shows citizen evidence without approval buttons 🚨
const AdminVerificationModal = ({ isOpen, onClose, complaint }) => {
    const [loadingEvidence, setLoadingEvidence] = useState(false);
    const [ownerVerificationData, setOwnerVerificationData] = useState(null);
    const [error, setError] = useState(null);

    const fetchVerifications = async () => {
        const ownerVerification = complaint.verifications?.[0];
        const verificationId = ownerVerification?._id;

        if (!complaint || !verificationId) { 
            setOwnerVerificationData(null);
            setError(null);
            return;
        }

        setLoadingEvidence(true);
        setError(null);
        try {
            const data = await api.getVerificationEvidence(complaint._id, verificationId); 
            setOwnerVerificationData(data.verification);

        } catch (err) {
            console.error('Failed to fetch evidence:', err.response?.data?.message || err.message);
            setError('Failed to fetch verification evidence. Check backend API/DB linkage.');
        } finally {
            setLoadingEvidence(false);
        }
    };

    useEffect(() => {
        if (isOpen && complaint) {
            if (complaint.verifications && complaint.verifications.length > 0) {
                fetchVerifications();
            } else {
                setOwnerVerificationData(null);
                setError(null); 
            }
        } else {
            setOwnerVerificationData(null);
            setError(null);
        }
    }, [isOpen, complaint]);

    if (!isOpen || !complaint) return null;

    const ownerVerified = complaint.verificationStatus === 'Verified Complete';
    const ownerRejected = complaint.verificationStatus === 'Verification Failed';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-sm sm:max-w-xl my-8">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Review Citizen Verification Evidence</h3>
                    <button onClick={onClose}><XCircle className='h-6 w-6 text-gray-400 hover:text-gray-600' /></button>
                </div>
                
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

                <div className="space-y-4">
                    <p className="text-base font-semibold text-gray-700">Complaint: {complaint.title}</p>
                    <p className='text-sm text-gray-600'>Admin Status: <ComplaintStatusBadge status={complaint.status} /></p>
                    
                    <div className='p-4 border-2 rounded-lg'
                        style={{ borderColor: ownerVerified ? '#10B981' : ownerRejected ? '#EF4444' : '#6B7280', backgroundColor: ownerVerified ? '#D1FAE5' : ownerRejected ? '#FEE2E2' : '#F3F4F6' }}
                    >
                        <p className="text-md font-bold flex items-center mb-1" 
                            style={{ color: ownerVerified ? '#059669' : ownerRejected ? '#B91C1C' : '#374151' }}
                        >
                            <ShieldCheck className='h-5 w-5 mr-2'/> 
                            Current Verification Status: {complaint.verificationStatus}
                        </p>
                        <p className='text-sm text-gray-600'>
                            Verification status is set automatically by the original complaint owner.
                        </p>
                    </div>

                    <h4 className='text-lg font-bold mt-6 pt-4 border-t'>Citizen Evidence:</h4>
                    
                    {loadingEvidence ? (
                        <div className="flex items-center justify-center py-4"><Loader2 className="animate-spin h-6 w-6 mr-2" /> Loading Owner Evidence...</div>
                    ) : (
                        <div className='space-y-4 max-h-[30vh] overflow-y-auto'>
                            {!ownerVerificationData ? (
                                <p className='text-sm text-gray-500'>Owner has not provided final verification evidence yet.</p>
                            ) : (
                                // Render the single verification record
                                <div className="border p-3 rounded-lg bg-gray-50">
                                    <p className={`font-bold text-sm flex items-center ${ownerVerificationData.isVerified ? 'text-green-600' : 'text-red-600'}`}>
                                        {ownerVerificationData.isVerified ? <ThumbsUp className='h-4 w-4 mr-2' /> : <ThumbsDown className='h-4 w-4 mr-2' />} 
                                        Owner's Review: {ownerVerificationData.isVerified ? 'Confirmed (Fixed)' : 'Rejected (Still Broken)'}
                                    </p>
                                    <p className='text-xs text-gray-500 my-1'>
                                        Submitted: {new Date(ownerVerificationData.verifiedAt).toLocaleString()}
                                    </p>
                                    <div className='text-xs text-gray-500 flex items-center mb-2'>
                                        <Globe className='h-3 w-3 mr-1'/> Loc: Lat {ownerVerificationData.location?.latitude?.toFixed(4)}, Lon {ownerVerificationData.location?.longitude?.toFixed(4)}
                                    </div>
                                    <a 
                                        href={ownerVerificationData.verificationImage} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-sm font-medium text-blue-600 hover:underline flex items-center"
                                    >
                                        <ImageIcon className="h-4 w-4 mr-1" /> View Verification Photo Proof
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* NO ADMIN ACTION BUTTONS - VIEW ONLY MODE */}
                    <button onClick={onClose} className="mt-4 w-full py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition duration-300">
                        Close Review
                    </button>
                </div>
            </div>
        </div>
    );
};
// -------------------------------------------------------------

const AdminDashboard = () => {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Dashboard global error
    const [isUpdating, setIsUpdating] = useState(false);
    const [isForwarding, setIsForwarding] = useState(false);
    const [forwardSuccess, setForwardSuccess] = useState(null);
    const [departmentEmail, setDepartmentEmail] = useState(DEPARTMENT_OPTIONS[0]?.email || ''); 
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [resolutionData, setResolutionData] = useState({ status: '', details: '' });
    const [statusFilter, setStatusFilter] = useState('All');
    const [adminVerificationModal, setAdminVerificationModal] = useState({ isOpen: false, complaint: null });
    
    // Error specific to the status update modal
    const [modalError, setModalError] = useState(null); 


    const isDescriptionRequired = (status) => {
        return status !== 'Registered';
    };

    const fetchAllComplaints = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.getAllComplaints();
            setComplaints(response.complaints || []);
        } catch (err) {
            console.error('Error fetching complaints:', err);
            setError(err.response?.data?.message || 'Failed to fetch all complaints. Check server connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllComplaints();
    }, []);

    const filteredComplaints = useMemo(() => {
        if (statusFilter === 'All') return complaints;
        return complaints.filter(c => c.status === statusFilter); // Filter only by main status
    }, [complaints, statusFilter]);

    const handleCloseModal = () => {
        setSelectedComplaint(null);
        setModalError(null); // Crucial: clear error when closing
    }
    
    const handleOpenModal = (complaint) => {
        setError(null); // Clear global error
        setModalError(null); // Clear modal-specific error
        setForwardSuccess(null);
        setDepartmentEmail(DEPARTMENT_OPTIONS[0]?.email || ''); 
        setSelectedComplaint(complaint);
        setResolutionData({
            status: complaint.status,
            details: complaint.resolutionDetails || ''
        });
    };

    const handleOpenAdminVerification = (complaint) => {
        setAdminVerificationModal({ isOpen: true, complaint });
    };

    const handleCloseAdminVerification = () => {
        setAdminVerificationModal({ isOpen: false, complaint: null });
    };

    const handleForwardEmail = async (e) => {
        e.preventDefault();
        if (!selectedComplaint || !departmentEmail) return;

        // Frontend check for Verified Complete status (Optional, but good UX)
        if (selectedComplaint.status === 'Verified Complete') {
            setModalError('Cannot forward: Complaint is already Verified Complete and finalized by the citizen.');
            return;
        }

        setIsForwarding(true);
        setForwardSuccess(null);
        setModalError(null); 

        try {
            await api.forwardComplaintEmail(selectedComplaint._id, departmentEmail);
            setForwardSuccess(`Complaint successfully forwarded to ${departmentEmail}.`);
        } catch (err) {
            console.error('Forward Email Failed:', err.response?.data || err);
            setModalError(err.response?.data?.message || 'Email forwarding failed. Check mail server logs.');
        } finally {
            setIsForwarding(false);
        }
    };
    
    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!selectedComplaint) return;

        // Front-end block: If it's Verified Complete, block the update
        if (selectedComplaint.status === 'Verified Complete') {
            setModalError('This complaint is Verified Complete by the citizen and its status cannot be changed by the administrator.');
            return;
        }
        // Front-end block: Block admin from setting *to* Verified Complete
        if (resolutionData.status === 'Verified Complete') {
            setModalError('Admin cannot set status directly to "Verified Complete". This status is set automatically by the original citizen.');
            return;
        }

        const trimmedDetails = resolutionData.details.trim();
        const newStatus = resolutionData.status;

        if (isDescriptionRequired(newStatus) && trimmedDetails.length === 0) {
            setModalError(`Resolution details are mandatory and cannot be blank for status: ${newStatus}.`);
            return;
        }

        setIsUpdating(true);
        setModalError(null); 

        try {
            const updated = await api.updateComplaintStatus(
                selectedComplaint._id,
                newStatus,
                trimmedDetails.length > 0 ? trimmedDetails : null
            );

            // If success, update local state and close modal
            setComplaints(complaints.map(c =>
                c._id === updated.complaint._id ? updated.complaint : c
            ));
            handleCloseModal(); 
            
        } catch (err) {
            console.error('Update Complaint Status Failed:', err.response?.data || err);
            const backendMessage = err.response?.data?.message || 'An unknown error occurred.';
            // If the backend returned the 403 error, it will show here.
            setModalError(`Update Failed: ${backendMessage}.`);
        } finally {
            setIsUpdating(false);
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-xl text-gray-700">
                <Loader2 className="animate-spin h-8 w-8 text-red-500 mr-3" />
                Loading All Complaints...
            </div>
        );
    }
    
    return (
        <div className="max-w-7xl lg:max-w-8xl mx-auto p-4 sm:p-8 my-5 sm:my-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600 mb-8">Manage and track all citizen-reported complaints.</p>

            <StatusCounts data={complaints} />

            {/* Global error for dashboard-level failures */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm" role="alert">{error}</div>
            )}

            <div className="flex justify-between items-center mb-6">
                <div className='flex items-center space-x-3'>
                    <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700">Filter:</label>
                    <select
                        id="statusFilter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-red-500 focus:border-red-500"
                    >
                        {FILTER_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <button
                    onClick={fetchAllComplaints}
                    className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-150 text-sm font-medium"
                >
                    <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </div>


            <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Citizen</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Citizen Verification</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredComplaints.map((c) => (
                            <tr key={c._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 truncate max-w-[150px]">{c.title}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">{c.category}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">{c.citizen?.name || 'N/A'}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-[150px] md:max-w-xs">
                                    {c.location?.address
                                        ? `${c.location.address}`
                                        : `Lat: ${c.location.latitude?.toFixed(4)}, Lon: ${c.location.longitude?.toFixed(4)}`}
                                </td>
                                <td className="px-6 py-4">
                                    <ComplaintStatusBadge status={c.status} />
                                </td>
                                <td className="px-6 py-4 hidden lg:table-cell">
                                    <p className="text-xs text-gray-700 font-medium">{c.verificationStatus}</p>
                                    {(c.verificationCount > 0 || c.rejectionCount > 0) && (
                                        <div className='flex items-center text-xs mt-1'>
                                            <ThumbsUp className='h-3 w-3 text-green-500 mr-1' /> {c.verificationCount}
                                            <ThumbsDown className='h-3 w-3 text-red-500 ml-2 mr-1' /> {c.rejectionCount}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-medium space-y-2 flex flex-col items-end">
                                    
                                    {/* Show View Button if ANY verification record exists */}
                                    {c.verifications?.length > 0 && (
                                        <button
                                            onClick={() => handleOpenAdminVerification(c)}
                                            className="text-purple-600 hover:text-purple-900 flex items-center justify-end ml-auto whitespace-nowrap text-xs bg-purple-100 p-1.5 rounded-md font-bold"
                                        >
                                            <ShieldCheck className='h-4 w-4 mr-1' /> View Owner Evidence
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleOpenModal(c)}
                                        className="text-red-600 hover:text-red-900 flex items-center justify-end ml-auto whitespace-nowrap"
                                    >
                                        <Settings className='h-4 w-4 mr-1' /> Update Status
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!filteredComplaints.length && !loading && (
                    <div className="p-10 text-center text-gray-500">
                        {statusFilter === 'All' ? 'No complaints have been submitted yet.' : `No complaints found with status: ${statusFilter}.`}
                    </div>
                )}
            </div>

            {/* Status Update Modal (The original one) */}
            {selectedComplaint && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-sm sm:max-w-lg my-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Manage Complaint #{selectedComplaint._id.substring(0, 8)}</h3>
                            <button onClick={handleCloseModal}>
                                <XCircle className='h-6 w-6 text-gray-400 hover:text-gray-600' />
                            </button>
                        </div>
                        <p className="text-sm mb-4 text-gray-600">**{selectedComplaint.title}** submitted by {selectedComplaint.citizen?.name}.</p>

                        {/* Modal-specific Error Display */}
                        {modalError && (
                             <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm" role="alert">
                                {modalError}
                             </div>
                        )}

                        {/* Block Message if Verified Complete */}
                        {selectedComplaint.status === 'Verified Complete' && !modalError && (
                             <div className="bg-gray-100 border border-gray-400 text-gray-700 px-4 py-3 rounded-lg mb-4 text-sm font-semibold" role="alert">
                                <ShieldCheck className='inline h-4 w-4 mr-1 mb-0.5 text-purple-600'/> This complaint is **Verified Complete** by the citizen and cannot be modified.
                             </div>
                        )}


                        {/* Email Forward Section */}
                        <div className="border border-red-200 p-4 rounded-lg mb-6 bg-red-50 space-y-3">
                            <h4 className='text-lg font-semibold text-red-700 flex items-center'>
                                <Mail className='h-5 w-5 mr-2' /> Forward Complaint to Department
                            </h4>
                            {forwardSuccess && <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded-lg text-xs">{forwardSuccess}</div>}

                            <form onSubmit={handleForwardEmail} className='flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2'>
                                <select
                                    value={departmentEmail}
                                    onChange={(e) => setDepartmentEmail(e.target.value)}
                                    required
                                    // Disable selection if status is Verified Complete
                                    disabled={selectedComplaint.status === 'Verified Complete' || isForwarding}
                                    className="sm:flex-1 border border-gray-300 rounded-lg p-3 text-sm focus:ring-red-500 focus:border-red-500 bg-white disabled:bg-gray-200"
                                >
                                    {DEPARTMENT_OPTIONS.map(d => (
                                        <option key={d.email} value={d.email}>{d.name} ({d.email})</option>
                                    ))}
                                </select>
                                <button
                                    type="submit"
                                    // Disable button if status is Verified Complete
                                    disabled={selectedComplaint.status === 'Verified Complete' || isForwarding}
                                    className="sm:w-auto px-4 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition duration-300 flex justify-center items-center text-sm disabled:bg-gray-400"
                                >
                                    {isForwarding ? <Loader2 className="animate-spin h-5 w-5" /> : "Forward"}
                                </button>
                            </form>
                        </div>

                        {/* Status Update Form */}
                        <form onSubmit={handleUpdate} className='space-y-4'>
                            <h4 className='text-lg font-semibold text-gray-700'>Update Internal Status</h4>

                            {/* Status Select */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                                <select
                                    value={resolutionData.status}
                                    onChange={(e) => {
                                        setResolutionData({ ...resolutionData, status: e.target.value });
                                        setModalError(null); 
                                    }}
                                    required
                                    // Disable selection if status is Verified Complete
                                    disabled={selectedComplaint.status === 'Verified Complete' || isUpdating}
                                    className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-red-500 focus:border-red-500 bg-white disabled:bg-gray-200"
                                >
                                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            {/* Resolution Details */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Resolution Details
                                    {isDescriptionRequired(resolutionData.status) && <span className="text-red-500 ml-1">(*) Required</span>}
                                </label>
                                <textarea
                                    rows="3"
                                    value={resolutionData.details}
                                    onChange={(e) => {
                                        setResolutionData({ ...resolutionData, details: e.target.value });
                                        setModalError(null); 
                                    }}
                                    placeholder="Enter details about the action taken to resolve or reject the complaint."
                                    required={isDescriptionRequired(resolutionData.status)}
                                    // Disable textarea if status is Verified Complete
                                    disabled={selectedComplaint.status === 'Verified Complete' || isUpdating}
                                    className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-red-500 focus:border-red-500 disabled:bg-gray-200"
                                />
                            </div>

                            {/* Image Link */}
                            <div className='p-2 bg-gray-50 rounded-lg'>
                                <a
                                    href={selectedComplaint.image}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
                                >
                                    <ImageIcon className="h-4 w-4 mr-1" /> View Photo Evidence (Citizen's Original)
                                </a>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                // Disable submission if status is Verified Complete
                                disabled={selectedComplaint.status === 'Verified Complete' || isUpdating}
                                className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition duration-300 flex justify-center disabled:bg-gray-400 text-base"
                            >
                                {isUpdating ? <Loader2 className="animate-spin h-6 w-6" /> : "Save Status Update"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Admin Verification Review Modal (View Only) */}
            <AdminVerificationModal 
                isOpen={adminVerificationModal.isOpen}
                onClose={handleCloseAdminVerification}
                complaint={adminVerificationModal.complaint}
            />
        </div>
    );
};

export default AdminDashboard;