import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../api/complaints.js';
import { MapPin, Image, Send, Loader2, Camera, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const SubmitComplaint = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Pothole',
        complaintImage: null,
        latitude: null,
        longitude: null,
        address: ''
    });

    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [useCamera, setUseCamera] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, complaintImage: file });
            setUseCamera(fileInputRef.current.files.length > 0 && fileInputRef.current.capture === 'environment');
        } else {
            setFormData({ ...formData, complaintImage: null });
        }
    };

    const removeImage = () => {
        setFormData({ ...formData, complaintImage: null });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setUseCamera(false);
    };

    const handleToggleMode = (isCamera) => {
        removeImage(); 
        setUseCamera(isCamera);
    };

    const triggerFileSelect = () => {
        handleToggleMode(false); 
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const triggerCamera = () => {
        handleToggleMode(true); 
        setTimeout(() => {
            if (fileInputRef.current) {
                fileInputRef.current.click();
            }
        }, 50); 
    };

    const getLocation = () => {
        setError(null);
        if (navigator.geolocation) {
            setLocationLoading(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocationLoading(false);
                    setFormData(prevData => ({
                        ...prevData,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    }));
                },
                (err) => {
                    setLocationLoading(false);
                    setError('Geolocation failed. Please ensure location services are enabled.');
                    console.error(err);
                }
            );
        } else {
            setLocationLoading(false);
            setError('Geolocation is not supported by this browser.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!formData.complaintImage) {
            setError('Please upload an image or capture a photo related to the complaint.');
            return;
        }

        if (!formData.latitude || !formData.longitude) {
            setError('Please capture your location coordinates before submitting.');
            return;
        }

        if (!formData.address.trim()) {
            setError('The address/landmark detail is required.');
            return;
        }


        const data = new FormData();
        for (const key in formData) {
            if (formData[key] !== null) {
                if (key === 'address') {
                     data.append(key, formData[key].trim());
                } else {
                     data.append(key, formData[key]);
                }
            }
        }

        setLoading(true);

        try {
            await api.submitComplaint(data);
            setSuccess('Complaint submitted successfully! Redirecting you to your complaints page.');

            setFormData({
                title: '',
                description: '',
                category: 'Pothole',
                complaintImage: null,
                latitude: null,
                longitude: null,
                address: '',
            });
            setUseCamera(false);
            removeImage();

            setTimeout(() => navigate('/citizen/my-complaints'), 2000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to submit complaint. Check server connection and authentication.');
        } finally {
            setLoading(false);
        }
    };


    return (
        // Responsive container
        <div className="max-w-xl lg:max-w-4xl mx-auto p-4 sm:p-8 my-5 sm:my-10 bg-white rounded-2xl shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6 border-b pb-3 text-center">Submit a New Complaint</h2>
            <p className="text-center text-gray-600 mb-6 text-sm">Citizen: **{user?.name}**</p>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm" role="alert">{error}</div>
            )}
            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm" role="alert">{success}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Title and Category Row (Responsive: stacks on mobile, 2 columns on desktop) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Complaint Title</label>
                        <input
                            type="text"
                            name="title"
                            id="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-base"
                            placeholder="e.g., Large Pothole on Main Street"
                        />
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            name="category"
                            id="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            required
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500 shadow-sm bg-white text-base"
                        >
                            <option value="Pothole">Pothole</option>
                            <option value="Garbage">Illegal Dumping/Garbage</option>
                            <option value="Water Leak">Water Leak/Pipe Burst</option>
                            <option value="Street Light">Street Light Outage</option>
                            <option value="Other">Other Infrastructure Issue</option>
                        </select>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Detailed Description</label>
                    <textarea
                        name="description"
                        id="description"
                        rows="4"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-base"
                        placeholder="Provide details about the issue, size, and severity..."
                    ></textarea>
                </div>

                {/* Location and Image Row (Responsive: stacks on mobile, 2 columns on desktop) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Location Input */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Location Capture</label>
                        <button
                            type="button"
                            onClick={getLocation}
                            disabled={locationLoading || loading}
                            className="w-full flex items-center justify-center p-3 border border-blue-500 rounded-lg text-blue-600 hover:bg-blue-50 transition duration-150 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed text-base"
                        >
                            {locationLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <MapPin className="h-5 w-5 mr-2" />}
                            {locationLoading ? 'Fetching Location...' : (formData.latitude ? 'Coordinates Captured!' : 'Capture Current Coordinates')}
                        </button>
                        {formData.latitude && (
                            <p className="text-xs text-green-600 mt-1">
                                Lat: {formData.latitude.toFixed(4)}, Lon: {formData.longitude.toFixed(4)}
                            </p>
                        )}
                        {/* Address Input (REQUIRED) */}
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 pt-2 mb-1">
                            Address / Landmark (Required)
                        </label>
                        <input
                            type="text"
                            name="address"
                            id="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter specific address, intersection, or landmark"
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm shadow-sm"
                        />
                    </div>

                    {/* Image Upload/Capture */}
                    <div className="space-y-2">
                        <label htmlFor="complaintImage" className="block text-sm font-medium text-gray-700">Image Evidence</label>

                        {/* Toggle Buttons / Styled Inputs */}
                        <div className="flex space-x-2 mb-2">
                            <button
                                type="button"
                                onClick={triggerFileSelect}
                                className={`flex-1 flex items-center justify-center p-2 rounded-lg text-sm transition ${!useCamera ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                <Image className="h-4 w-4 mr-2" /> Choose File
                            </button>
                            <button
                                type="button"
                                onClick={triggerCamera}
                                className={`flex-1 flex items-center justify-center p-2 rounded-lg text-sm transition ${useCamera ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                <Camera className="h-4 w-4 mr-2" /> Capture Photo
                            </button>
                        </div>

                        {/* Hidden File Input Element */}
                        <div style={{ display: 'none' }}>
                            <input
                                key={useCamera.toString()}
                                type="file"
                                name="complaintImage"
                                id="complaintImage"
                                accept="image/*"
                                onChange={handleFileChange}
                                required
                                ref={fileInputRef}
                                capture={useCamera ? 'environment' : undefined} 
                            />
                        </div>
                        {/* File Name Display */}
                        {formData.complaintImage && (
                            <div className="flex items-center justify-between p-3 mt-3 bg-green-50 rounded-lg border border-green-300">
                                <p className="text-sm font-medium text-green-700 truncate">
                                    File selected: **{formData.complaintImage.name}**
                                </p>
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="p-1 bg-white text-red-600 rounded-full shadow-md hover:bg-red-50 transition"
                                    title="Remove image"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                        {useCamera && !formData.complaintImage && (
                            <div className="p-3 mt-3 bg-gray-50 rounded-lg border border-gray-300 text-sm text-gray-600">
                                Click the "Capture Photo" button to open your device camera.
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || locationLoading}
                    className="w-full flex items-center justify-center p-4 bg-green-600 text-white text-lg font-bold rounded-lg shadow-md hover:bg-green-700 transition duration-300 disabled:bg-gray-400"
                >
                    {loading ? <Loader2 className="animate-spin h-6 w-6 mr-3" /> : (
                        <>
                            <Send className="h-6 w-6 mr-3" />
                            Submit Complaint
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default SubmitComplaint;