// File: src/pages/citizen/mycomplaint.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../api/complaints'; 
import { useAuth } from '../../context/AuthContext'; 
import { RefreshCw, MapPin, Tag, Calendar, MessageSquare, Image as ImageIcon, Loader2, XCircle, ThumbsUp, ThumbsDown, Camera, Send, ShieldCheck, CheckCircle } from 'lucide-react'; 

// DescriptionModal component (UNCHANGED)
const DescriptionModal = ({ isOpen, onClose, title, details }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xl font-bold text-gray-900 truncate">Update for: {title}</h4>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <XCircle className='h-6 w-6' />
                    </button>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg max-h-[60vh] overflow-y-auto">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Admin Resolution Details:</p>
                    <p className="whitespace-pre-wrap text-gray-800 text-sm">{details}</p>
                </div>
                <button
                    onClick={onClose}
                    className="mt-4 w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

// VerificationModal component (Owner-Only, Auto-Complete Logic)
const VerificationModal = ({ isOpen, onClose, complaint, onVerificationSubmit, verifierId }) => {
    const fileInputRef = React.useRef(null);
    const [isVerified, setIsVerified] = useState(true); 
    const [imageFile, setImageFile] = useState(null);
    const [location, setLocation] = useState({ latitude: null, longitude: null });
    const [locLoading, setLocLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState(null);

    const getLocation = () => {
        setError(null);
        if (navigator.geolocation) {
            setLocLoading(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocLoading(false);
                    setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
                },
                () => {
                    setLocLoading(false);
                    setError('Geolocation failed. Please enable location services.');
                }
            );
        } else {
            setLocLoading(false);
            setError('Geolocation is not supported by this browser.');
        }
    };
    
    const handleFileChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const removeImage = () => {
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!imageFile) {
            setError('Photo proof is required.');
            return;
        }
        if (!location.latitude) {
            setError('Please capture your current location.');
            return;
        }

        const formData = new FormData();
        formData.append('isVerified', isVerified); 
        formData.append('latitude', location.latitude);
        formData.append('longitude', location.longitude);
        formData.append('verificationImage', imageFile);

        setSubmitLoading(true);
        try {
            await onVerificationSubmit(complaint._id, formData);
            onClose(); 
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit verification.');
        } finally {
            setSubmitLoading(false);
        }
    };
    
    useEffect(() => {
        if(isOpen) {
            setIsVerified(true);
            setImageFile(null);
            setLocation({ latitude: null, longitude: null });
            setError(null);
            setLocLoading(false);
            setSubmitLoading(false);
        }
    }, [isOpen]);

    if (!isOpen || !complaint) return null;
    
    const isOwner = complaint.citizen?.toString() === verifierId; 
    const isAlreadyVerified = complaint.verifications?.length > 0; 

    if (!isOwner) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                 <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg my-8 text-center">
                    <ShieldCheck className='h-10 w-10 text-blue-500 mx-auto mb-4' />
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Review Restricted</h4>
                    <p className="text-gray-600">
                        Only the **original complaint submitter** can provide the final verification.
                    </p>
                    <button onClick={onClose} className="mt-4 py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Close</button>
                 </div>
            </div>
        );
    }

    if (isAlreadyVerified) {
          return (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                   <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg my-8 text-center">
                        <CheckCircle className='h-10 w-10 text-green-500 mx-auto mb-4' />
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Verification Already Submitted</h4>
                        <p className="text-gray-600">
                            You have already submitted your final review. Current status: **{complaint.status}**.
                        </p>
                        <button onClick={onClose} className="mt-4 py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Close</button>
                   </div>
              </div>
          );
      }


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg my-8 space-y-4">
                <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xl font-bold text-gray-900">Verify Resolution: {complaint.title}</h4>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle className='h-6 w-6' /></button>
                </div>
                
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

                <p className="text-sm text-gray-700">Official Status: <span className='font-semibold text-green-700'>Resolved</span>. Is the fix effective?</p>

                <form onSubmit={handleSubmit} className='space-y-4'>
                    {/* Thumbs Up/Down Toggle */}
                    <div className="flex justify-center space-x-4">
                        <button
                            type='button'
                            onClick={() => setIsVerified(true)}
                            className={`flex items-center p-3 rounded-lg font-bold transition duration-200 ${isVerified ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            <ThumbsUp className='h-5 w-5 mr-2' /> Yes, Fixed
                        </button>
                        <button
                            type='button'
                            onClick={() => setIsVerified(false)}
                            className={`flex items-center p-3 rounded-lg font-bold transition duration-200 ${!isVerified ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            <ThumbsDown className='h-5 w-5 mr-2' /> No, Still Broken
                        </button>
                    </div>

                    {/* Photo Proof */}
                    <div className="space-y-2 border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700">Verification Photo Proof (Required)</label>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current.click()}
                            className="w-full flex items-center justify-center p-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition text-sm"
                        >
                            <Camera className="h-4 w-4 mr-2" /> {imageFile ? `Change Photo (${imageFile.name.substring(0, 20)}...)` : 'Capture/Upload Proof Photo'}
                        </button>
                        <input
                            type="file"
                            name="verificationImage"
                            accept="image/*"
                            capture="environment" 
                            onChange={handleFileChange}
                            required
                            ref={fileInputRef}
                            className='hidden'
                        />
                        {imageFile && (
                            <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-300">
                                <p className="text-xs font-medium text-green-700 truncate">
                                    File selected: **{imageFile.name}**
                                </p>
                                <button type="button" onClick={removeImage} className="p-1 text-red-600 hover:text-red-800" title="Remove image"><XCircle className="h-4 w-4" /></button>
                            </div>
                        )}
                    </div>
                    
                    {/* Location Capture */}
                    <div className="space-y-2 border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700">Capture Current Location (Required)</label>
                        <button
                            type="button"
                            onClick={getLocation}
                            disabled={locLoading || submitLoading}
                            className="w-full flex items-center justify-center p-3 border border-purple-500 rounded-lg text-purple-600 hover:bg-purple-50 transition shadow-sm disabled:opacity-70 text-sm"
                        >
                            {locLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
                            {locLoading ? 'Fetching Location...' : (location.latitude ? 'Location Captured!' : 'Capture Coordinates')}
                        </button>
                        {location.latitude && (
                            <p className="text-xs text-green-600 text-center">
                                Lat: {location.latitude.toFixed(4)}, Lon: {location.longitude.toFixed(4)}
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={submitLoading || locLoading || !imageFile || !location.latitude}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition duration-300 flex justify-center disabled:bg-gray-400 text-base"
                    >
                        {submitLoading ? <Loader2 className="animate-spin h-6 w-6 mr-2" /> : <Send className="h-6 w-6 mr-2" />}
                        {submitLoading ? "Submitting Final Review..." : "Submit Final Verification"}
                    </button>
                </form>
            </div>
        </div>
    );
};


const ComplaintStatusBadge = ({ status }) => {
    const statusClasses = {
        Registered: 'bg-yellow-100 text-yellow-800 border-yellow-500',
        'In Progress': 'bg-blue-100 text-blue-800 border-blue-500',
        Resolved: 'bg-green-100 text-green-800 border-green-500',
        Rejected: 'bg-red-100 text-red-800 border-red-500',
        'Verified Complete': 'bg-purple-100 text-purple-800 border-purple-500',
    };
    return (
        <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${statusClasses[status] || 'bg-gray-100 text-gray-800 border-gray-500'}`}>
            {status}
        </span>
    );
};

const MyComplaints = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalData, setModalData] = useState({ isOpen: false, title: '', details: '' });
    const [verificationModal, setVerificationModal] = useState({ isOpen: false, complaint: null });

    const fetchComplaints = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.getMyComplaints();
            setComplaints(response.complaints || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Failed to fetch your complaints. Ensure the server is running and you are logged in.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const openDescriptionModal = (title, details) => {
        setModalData({ isOpen: true, title, details });
    };

    const closeDescriptionModal = () => {
        setModalData({ isOpen: false, title: '', details: '' });
    };
    
    const handleOpenVerification = (complaint) => {
        setVerificationModal({ isOpen: true, complaint });
    };
    
    const handleCloseVerification = () => {
        setVerificationModal({ isOpen: false, complaint: null });
    };
    
    const handleVerificationSubmit = async (complaintId, formData) => {
        try {
            const response = await api.submitVerification(complaintId, formData);
            fetchComplaints(); 
            return response;
        } catch (err) {
            console.error("Verification submit error:", err);
            throw err;
        }
    };

    const ComplaintCard = ({ complaint }) => {
        const isOwner = complaint.citizen?.toString() === user?.id; 
        const isOwnerVerified = complaint.verifications?.length > 0; 
        
        // Show button ONLY if status is Resolved AND the user is the owner AND the owner has NOT verified
        const showVerificationButton = complaint.status === 'Resolved' && isOwner && !isOwnerVerified;
        
        return (
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 border-l-4 border-blue-600">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 pr-2">{complaint.title}</h3>
                    <div className='flex flex-col items-end space-y-2 flex-shrink-0'>
                        <ComplaintStatusBadge status={complaint.status} />
                        {complaint.resolutionDetails && (
                            <button
                                onClick={() => openDescriptionModal(complaint.title, complaint.resolutionDetails)}
                                className="flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-purple-100 text-purple-800 hover:bg-purple-200 transition whitespace-nowrap"
                            >
                                <MessageSquare className='h-3 w-3 mr-1' /> View Description
                            </button>
                        )}
                    </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 overflow-hidden text-ellipsis">{complaint.description.substring(0, 150)}...</p>

                {/* UPDATED: Added prominent details block with Lat/Lon and Address */}
                <div className="grid grid-cols-2 gap-y-2 pt-2 border-t border-gray-100 text-sm text-gray-600">
                    <p className="flex items-center">
                        <Tag className="h-4 w-4 mr-2 text-blue-500" />
                        <strong>Category:</strong> {complaint.category}
                    </p>
                    <p className="flex items-center justify-end text-right">
                        <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                        <strong>Date:</strong> {new Date(complaint.createdAt).toLocaleDateString()}
                    </p>
                    {/* Display Location Details (Address and Coordinates) */}
                    <div className="col-span-2">
                        <p className="flex items-start text-sm text-gray-700">
                            <MapPin className="h-4 w-4 mr-2 text-red-500 mt-1 flex-shrink-0" />
                            <span className='font-semibold'>Location:</span>
                        </p>
                        <p className="pl-6 text-xs text-gray-600 truncate">
                             Address: {complaint.location?.address || 'N/A'}
                        </p>
                         <p className="pl-6 text-xs text-gray-600">
                            Coords: Lat {complaint.location?.latitude?.toFixed(4)}, Lon {complaint.location?.longitude?.toFixed(4)}
                        </p>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                    <a
                        href={complaint.image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
                    >
                        <ImageIcon className="h-4 w-4 mr-1" />
                        View Photo Evidence
                    </a>
                </div>
                
                {/* Verification Status & Button (Owner-Only, Auto-Complete) */}
                {complaint.status !== 'Registered' && complaint.status !== 'In Progress' && (
                    <div className='mt-2 pt-2 border-t border-gray-100'>
                        {showVerificationButton ? (
                            <button
                                onClick={() => handleOpenVerification(complaint)}
                                className="w-full flex items-center justify-center p-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                            >
                                <ThumbsUp className='h-4 w-4 mr-2' /> Provide Final Verification
                            </button>
                        ) : (isOwnerVerified && complaint.verificationStatus === 'Verification Failed') ? (
                            <p className='text-sm text-red-600 font-medium text-center border p-2 rounded bg-red-50'>
                                ❌ Resolution Rejected by You (Status: Resolved).
                            </p>
                        ) : complaint.status === 'Verified Complete' ? (
                            <p className='text-sm text-purple-800 font-bold text-center border p-2 rounded bg-purple-100'>
                                🎉 Issue Officially Verified Complete!
                            </p>
                        ) : complaint.status === 'Rejected' ? (
                            <p className='text-sm text-gray-500 font-bold text-center border p-2 rounded bg-gray-100'>
                                🚫 Complaint Rejected by Admin.
                            </p>
                        ) : isOwner && complaint.status === 'Resolved' && complaint.verificationStatus === 'Pending Owner Review' ? (
                             <p className='text-sm text-gray-500 font-medium text-center border p-2 rounded'>
                                Awaiting your action. Click 'Provide Final Verification'.
                            </p>
                        ) : null}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8 my-5 sm:my-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Your Reported Issues</h1>
                <button
                    onClick={fetchComplaints}
                    className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-150 text-sm font-medium"
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </div>

            {loading && !complaints.length && (
                <div className="min-h-[200px] flex items-center justify-center text-xl text-gray-700">
                    <Loader2 className="animate-spin h-8 w-8 text-blue-500 mr-3" /> Loading Your Reports...
                </div>
            )}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">{error}</div>
            )}

            {!loading && !complaints.length && !error && (
                <p className="text-center text-gray-500 py-10 border border-dashed rounded-lg">You haven't submitted any complaints yet.</p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {complaints.map(complaint => (
                    <ComplaintCard key={complaint._id} complaint={complaint} />
                ))}
            </div>

            <DescriptionModal
                isOpen={modalData.isOpen}
                onClose={closeDescriptionModal}
                title={modalData.title}
                details={modalData.details}
            />

            <VerificationModal
                isOpen={verificationModal.isOpen}
                onClose={handleCloseVerification}
                complaint={verificationModal.complaint}
                onVerificationSubmit={handleVerificationSubmit}
                verifierId={user?.id}
            />
        </div>
    );
};

export default MyComplaints;
