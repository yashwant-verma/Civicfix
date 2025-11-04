import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../api/complaints';
import { RefreshCw, MapPin, Tag, Calendar, MessageSquare, Image, Loader2, XCircle } from 'lucide-react';

const DescriptionModal = ({ isOpen, onClose, title, details }) => {
    if (!isOpen) return null;

    return (
        // Responsive: Centering and adjusting size
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

const ComplaintStatusBadge = ({ status }) => {
    const statusClasses = {
        Registered: 'bg-yellow-100 text-yellow-800 border-yellow-500',
        'In Progress': 'bg-blue-100 text-blue-800 border-blue-500',
        Resolved: 'bg-green-100 text-green-800 border-green-500',
        Rejected: 'bg-red-100 text-red-800 border-red-500',
    };
    return (
        <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${statusClasses[status] || 'bg-gray-100 text-gray-800 border-gray-500'}`}>
            {status}
        </span>
    );
};

const MyComplaints = () => {
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalData, setModalData] = useState({ isOpen: false, title: '', details: '' });

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

    const ComplaintCard = ({ complaint }) => (
        // Responsive padding, shadow, and layout
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

            {/* Grid layout for details on small screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-gray-600 text-sm">
                <p className="flex items-center col-span-full">
                    <Tag className="h-4 w-4 mr-2 text-blue-500" />
                    <strong>Category:</strong> {complaint.category}
                </p>
                <p className="flex items-start col-span-full">
                    <MessageSquare className="h-4 w-4 mr-2 text-blue-500 mt-1 flex-shrink-0" />
                    <span className="truncate"><strong>Description:</strong> {complaint.description}</span>
                </p>

                <p className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                    <strong>Submitted:</strong> {new Date(complaint.createdAt).toLocaleDateString()}
                </p>

                <p className="flex items-start col-span-full">
                    <MapPin className="h-4 w-4 mr-2 text-blue-500 mt-1 flex-shrink-0" />
                    <span className="truncate">
                        <strong>Location:</strong>{' '}
                        {complaint.location.address
                            ? `${complaint.location.address}`
                            : `Lat: ${complaint.location.latitude}, Lon: ${complaint.location.longitude}`}
                    </span>
                </p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
                <a
                    href={complaint.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
                >
                    <Image className="h-4 w-4 mr-1" />
                    View Photo Evidence
                </a>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8 my-5 sm:my-10">
            {/* Responsive Header: Uses flex-col on mobile, centers on desktop */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-3 gap-y-4">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">My Submitted Complaints</h2>
                <button
                    onClick={fetchComplaints}
                    disabled={loading}
                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-150 disabled:bg-gray-400 w-full sm:w-auto justify-center"
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {loading && (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="animate-spin h-8 w-8 text-blue-500 mr-3" />
                    <span className="text-lg text-gray-600">Loading complaints...</span>
                </div>
            )}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">
                    <p>{error}</p>
                </div>
            )}

            {!loading && complaints.length === 0 && !error && (
                <div className="text-center py-10 border border-dashed border-gray-300 rounded-lg bg-white">
                    <p className="text-xl text-gray-600">You have not submitted any complaints yet.</p>
                    <button
                        onClick={() => navigate('/citizen/submit-complaint')}
                        className="mt-4 text-blue-600 hover:underline font-medium"
                    >
                        Click here to submit your first complaint.
                    </button>
                </div>
            )}

            {/* Responsive Grid: 1 column on mobile, 2 on md, 3 on lg */}
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
        </div>
    );
};

export default MyComplaints;