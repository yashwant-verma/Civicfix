import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyComplaints } from '../../api/complaints';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Mail, ListPlus, CheckCircle, Clock, MessageSquare, XCircle } from 'lucide-react';

const ComplaintStatusBadge = ({ status }) => {
    const statusClasses = {
        Registered: 'bg-yellow-100 text-yellow-800 border-yellow-500',
        'In Progress': 'bg-blue-100 text-blue-800 border-blue-500',
        Resolved: 'bg-green-100 text-green-800 border-green-500',
        Rejected: 'bg-red-100 text-red-800 border-red-500',
    };
    return (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusClasses[status] || 'bg-gray-100 text-gray-800 border-gray-500'}`}>
            {status}
        </span>
    );
};

const DescriptionModal = ({ isOpen, onClose, title, details }) => {
    if (!isOpen) return null;

    return (
        // Responsive: Centering and padding on small screens
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

const StatisticCard = ({ title, value, icon, color }) => (
    <div className={`bg-white p-4 sm:p-6 rounded-xl shadow-lg border-l-4 ${color} flex items-center justify-between`}>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color.replace('border-l-4 border-', 'bg-')}`}>
            {icon}
        </div>
    </div>
);


const CitizenDashboard = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [modalData, setModalData] = useState({ isOpen: false, title: '', details: '' });

    useEffect(() => {
        if (authLoading || !isAuthenticated) {
            if (!authLoading && !isAuthenticated) navigate('/login', { replace: true });
            return;
        }

        const fetchComplaints = async () => {
            setLoading(true);
            try {
                const response = await getMyComplaints();
                setComplaints(response.complaints || []);
            } catch (err) {
                console.error('Error fetching complaints:', err);
                setComplaints([]);
                setError(err.response?.data?.message || 'Failed to fetch your complaints. Ensure the server is running.');
            } finally {
                setLoading(false);
            }
        };

        fetchComplaints();
    }, [navigate, isAuthenticated, user, authLoading]);

    const openDescriptionModal = (title, details) => {
        setModalData({ isOpen: true, title, details });
    };

    const closeDescriptionModal = () => {
        setModalData({ isOpen: false, title: '', details: '' });
    };

    if (authLoading || loading) {
        return <div className="min-h-screen flex items-center justify-center text-xl text-gray-700">
            <Loader2 className="animate-spin h-8 w-8 text-blue-500 mr-3" />
            {authLoading ? 'Initializing Auth...' : 'Loading Complaint Data...'}
        </div>;
    }

    const totalComplaints = complaints.length;
    const resolvedComplaints = complaints.filter(c => c.status === 'Resolved').length;
    const inProgressComplaints = complaints.filter(c => c.status === 'In Progress').length;


    const ComplaintCard = ({ complaint }) => (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border-t-4 border-blue-600 space-y-3">
            <div className="flex justify-between items-start">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate pr-2">{complaint.title}</h3>
                <div className='flex flex-col items-end space-y-2 flex-shrink-0'>
                    <ComplaintStatusBadge status={complaint.status} />
                    {complaint.resolutionDetails && (
                        <button
                            onClick={() => openDescriptionModal(complaint.title, complaint.resolutionDetails)}
                            className="flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-purple-100 text-purple-800 hover:bg-purple-200 transition"
                        >
                            <MessageSquare className='h-3 w-3 mr-1' /> Admin Description
                        </button>
                    )}
                </div>
            </div>

            <p className="text-gray-600 text-sm overflow-hidden text-ellipsis h-10">{complaint.description.substring(0, 100)}...</p>

            <div className="pt-2 border-t border-gray-100 text-sm text-gray-500 space-y-1">
                <p><strong>Category:</strong> {complaint.category}</p>
                <p className="truncate">
                    <strong>Address:</strong>{' '}
                    {complaint.location?.address
                        ? `${complaint.location.address}`
                        : `Lat: ${complaint.location?.latitude?.toFixed(4)}, Lon: ${complaint.location?.longitude?.toFixed(4)}`}
                </p>
            </div>

            {complaint.image && (
                <a href={complaint.image} target="_blank" rel="noopener noreferrer" className="block mt-2">
                    <img
                        src={complaint.image}
                        alt="Evidence"
                        className="w-full h-28 object-cover rounded-lg hover:opacity-75 transition-opacity duration-150"
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x150/e0e7ff/3f3f46?text=Image+Unavailable" }}
                    />
                </a>
            )}
        </div>
    );

    return (
        // 🚨 Main content container adjusted for padding and centering 🚨
        <div className="max-w-7xl mx-auto p-4 sm:p-8 my-5 sm:my-10"> 
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Welcome, {user?.name || 'Citizen'}!</h2>
            <p className="text-gray-600 mb-8">Your impact summary and recent reports.</p>

            {/* Responsive Statistics Cards: 1 column on mobile, 3 columns on tablet+ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10">
                <StatisticCard
                    title="Total Complaints"
                    value={totalComplaints}
                    icon={<ListPlus className="h-6 w-6 text-blue-600" />}
                    color="border-blue-600"
                />
                <StatisticCard
                    title="Resolved Issues"
                    value={resolvedComplaints}
                    icon={<CheckCircle className="h-6 w-6 text-green-600" />}
                    color="border-green-600"
                />
                <StatisticCard
                    title="In Progress"
                    value={inProgressComplaints}
                    icon={<Clock className="h-6 w-6 text-yellow-600" />}
                    color="border-yellow-600"
                />
            </div>


            <button
                onClick={() => navigate('/citizen/submit-complaint')}
                className="mb-8 w-full sm:w-auto flex items-center justify-center p-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 text-base"
            >
                <Mail className="h-5 w-5 mr-2" /> Submit New Complaint
            </button>


            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Your Recent Submissions ({totalComplaints})</h3>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">
                    <p>{error}</p>
                </div>
            )}


            {/* Responsive Complaint Grid: 1 column on mobile, 2 on md, 3 on lg */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {complaints.length > 0 ? (
                    complaints.slice(0, 6).map((complaint) => (
                        <ComplaintCard key={complaint._id} complaint={complaint} />
                    ))
                ) : (
                    !error && (
                        <p className="text-base sm:text-lg text-gray-500 col-span-full py-6 text-center border border-dashed rounded-lg">
                            You have no submitted complaints. Click "Submit New Complaint" to get started!
                        </p>
                    )
                )}
            </div>

            {totalComplaints > 6 && (
                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate('/citizen/my-complaints')}
                        className="text-base sm:text-lg font-medium text-blue-600 hover:underline"
                    >
                        View All My Complaints ({totalComplaints - 6} more) →
                    </button>
                </div>
            )}

            <DescriptionModal 
                isOpen={modalData.isOpen}
                onClose={closeDescriptionModal}
                title={modalData.title}
                details={modalData.details}
            />
        </div>
    );
};

export default CitizenDashboard;