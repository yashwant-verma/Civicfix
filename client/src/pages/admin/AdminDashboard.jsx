import React, { useState, useEffect, useMemo } from 'react';
import * as api from '../../api/complaints'; 
import { useAuth } from '../../context/AuthContext';
import { Loader2, Zap, Settings, XCircle, CheckCircle, Clock, Mail } from 'lucide-react';

const STATUS_OPTIONS = ['Registered', 'In Progress', 'Resolved', 'Rejected'];
const FILTER_OPTIONS = ['All', ...STATUS_OPTIONS];

// 🚨 Department Data (Emails updated here by you)
const DEPARTMENT_OPTIONS = [
    { name: 'Public Works Dept', email: 'yashver2005@gmail.com' },
    { name: 'Sanitation Dept', email: 'sanitation@city.gov' },
    { name: 'Traffic & Transport', email: 'traffic@city.gov' },
    { name: 'Electrical/Lighting', email: 'electric@city.gov' },
];

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

const AdminDashboard = () => {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isForwarding, setIsForwarding] = useState(false);
    const [forwardSuccess, setForwardSuccess] = useState(null);
    const [departmentEmail, setDepartmentEmail] = useState('');
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [resolutionData, setResolutionData] = useState({ status: '', details: '' });
    const [statusFilter, setStatusFilter] = useState('All');

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
            setError(err.response?.data?.message || 'Failed to fetch all complaints. Server or token issue.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllComplaints();
    }, []);

    const filteredComplaints = useMemo(() => {
        if (statusFilter === 'All') {
            return complaints;
        }
        return complaints.filter(c => c.status === statusFilter);
    }, [complaints, statusFilter]);

    const handleOpenModal = (complaint) => {
        setError(null);
        setForwardSuccess(null);
        setDepartmentEmail(DEPARTMENT_OPTIONS[0].email);
        setSelectedComplaint(complaint);
        setResolutionData({
            status: complaint.status,
            details: complaint.resolutionDetails || ''
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!selectedComplaint) return;

        const trimmedDetails = resolutionData.details.trim();

        if (isDescriptionRequired(resolutionData.status) && trimmedDetails.length === 0) {
            setError(`Resolution details are mandatory and cannot be blank for status: ${resolutionData.status}.`);
            return;
        }

        setIsUpdating(true);
        setError(null);

        try {
            const updated = await api.updateComplaintStatus(
                selectedComplaint._id,
                resolutionData.status,
                trimmedDetails.length > 0 ? trimmedDetails : null
            );

            setComplaints(complaints.map(c =>
                c._id === updated.complaint._id ? updated.complaint : c
            ));

            setSelectedComplaint(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update complaint status.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleForwardEmail = async () => {
        if (!selectedComplaint || !departmentEmail) return;

        setIsForwarding(true);
        setError(null);
        setForwardSuccess(null);

        try {
            const result = await api.forwardComplaintEmail(selectedComplaint._id, departmentEmail);
            setForwardSuccess(result.message);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to forward complaint email. Check your network or server logs.';
            setError(errorMessage);
        } finally {
            setIsForwarding(false);
        }
    };

    const StatusCounts = ({ data }) => {
        const counts = data.reduce((acc, c) => {
            acc[c.status] = (acc[c.status] || 0) + 1;
            return acc;
        }, {});

        return (
            // Responsive: Changes from 2 to 4 columns on small screens
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"> 
                <div className="bg-blue-100 p-4 rounded-xl shadow-md flex items-center justify-between">
                    <p className="text-blue-800 text-3xl font-bold">{data.length}</p>
                    <p className="text-blue-700 font-semibold text-right">Total</p>
                </div>
                <div className="bg-yellow-100 p-4 rounded-xl shadow-md flex items-center justify-between">
                    <p className="text-yellow-800 text-3xl font-bold">{counts.Registered || 0}</p>
                    <p className="text-yellow-700 font-semibold text-right">New</p>
                </div>
                <div className="bg-green-100 p-4 rounded-xl shadow-md flex items-center justify-between">
                    <p className="text-green-800 text-3xl font-bold">{counts.Resolved || 0}</p>
                    <p className="text-green-700 font-semibold text-right">Resolved</p>
                </div>
                <div className="bg-red-100 p-4 rounded-xl shadow-md flex items-center justify-between">
                    <p className="text-red-800 text-3xl font-bold">{counts.Rejected || 0}</p>
                    <p className="text-red-700 font-semibold text-right">Rejected</p>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-xl text-gray-700">
                <Loader2 className="animate-spin h-8 w-8 text-red-500 mr-3" />
                Loading Admin Dashboard...
            </div>
        );
    }

    return (
        // Increased max width on large screens, auto margin for centering, responsive padding
        <div className="max-w-7xl lg:max-w-8xl mx-auto p-4 sm:p-8 my-5 sm:my-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-red-700 mb-2 flex items-center">
                <Zap className="h-7 w-7 sm:h-8 sm:w-8 mr-3 text-red-500" /> Admin Control Panel
            </h2>
            <p className="text-gray-600 mb-8">Manage and track all reported city issues.</p>

            <StatusCounts data={complaints} />

            {error && !isForwarding && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">
                    <p>{error}</p>
                </div>
            )}

            {/* Responsive Controls: Stacks vertically on small screens */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-y-4">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800">All Complaints</h3>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                    <div className="flex items-center space-x-2">
                        <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter:</label>
                        <select
                            id="statusFilter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg text-sm bg-white shadow-sm w-full"
                        >
                            {FILTER_OPTIONS.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={fetchAllComplaints}
                        disabled={loading || isUpdating}
                        className="flex items-center bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-300 transition duration-150 text-sm disabled:opacity-50 w-full sm:w-auto justify-center"
                    >
                        <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh List
                    </button>
                </div>
            </div>

            {/* Responsive Table: Enables horizontal scroll on small screens */}
            <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                            {/* Hide less critical columns on small screens */}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Citizen</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                                <td className="px-6 py-4 text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleOpenModal(c)}
                                        className="text-red-600 hover:text-red-900 flex items-center justify-end ml-auto whitespace-nowrap"
                                    >
                                        <Settings className='h-4 w-4 mr-1' /> Update
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

            {/* Status Update Modal (Responsive centering and scroll) */}
            {selectedComplaint && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-sm sm:max-w-lg my-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Manage Complaint #{selectedComplaint._id.substring(0, 8)}</h3>
                            <button onClick={() => setSelectedComplaint(null)}>
                                <XCircle className='h-6 w-6 text-gray-400 hover:text-gray-600' />
                            </button>
                        </div>
                        <p className="text-sm mb-4 text-gray-600">**{selectedComplaint.title}** submitted by {selectedComplaint.citizen?.name}.</p>

                        {/* Email Forward Section */}
                        <div className="border border-red-200 p-4 rounded-lg mb-6 bg-red-50 space-y-3">
                            <h4 className='text-lg font-semibold text-red-700 flex items-center'>
                                <Mail className='h-5 w-5 mr-2' /> Forward Complaint to Department
                            </h4>

                            {/* Department Select */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Department</label>
                                <select
                                    value={departmentEmail}
                                    onChange={(e) => setDepartmentEmail(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-red-500 focus:border-red-500 bg-white"
                                    disabled={isForwarding}
                                >
                                    {DEPARTMENT_OPTIONS.map(d => (
                                        <option key={d.email} value={d.email}>{d.name} ({d.email})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Forward Button */}
                            <button
                                onClick={handleForwardEmail}
                                disabled={isForwarding || !departmentEmail}
                                className="w-full py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition duration-300 flex justify-center items-center disabled:bg-gray-400 text-base"
                            >
                                {isForwarding ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Mail className="h-5 w-5 mr-2" />}
                                {isForwarding ? "Sending Email..." : `Forward Complaint to ${DEPARTMENT_OPTIONS.find(d => d.email === departmentEmail)?.name || 'Department'}`}
                            </button>

                            {/* Forward Success/Error Message */}
                            {forwardSuccess && (
                                <p className="text-sm text-green-700 bg-green-100 p-2 rounded flex items-center">
                                    <CheckCircle className='h-4 w-4 mr-1' /> {forwardSuccess}
                                </p>
                            )}
                            {error && isForwarding === false && (
                                <p className="text-sm text-red-700 bg-red-100 p-2 rounded flex items-center">
                                    <XCircle className='h-4 w-4 mr-1' /> {error}
                                </p>
                            )}
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
                                        setError(null);
                                    }}
                                    required
                                    className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-red-500 focus:border-red-500 bg-white"
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
                                        setError(null);
                                    }}
                                    placeholder="Enter details about the action taken to resolve or reject the complaint."
                                    required={isDescriptionRequired(resolutionData.status)}
                                    className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-red-500 focus:border-red-500"
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
                                    View Photo Evidence
                                </a>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isUpdating}
                                className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition duration-300 flex justify-center disabled:bg-gray-400 text-base"
                            >
                                {isUpdating ? <Loader2 className="animate-spin h-6 w-6" /> : "Save Status Update"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;