// File: src/pages/admin/SuccessRatePage.jsx

import React, { useEffect, useState } from 'react';
import * as api from '../../api/complaints';
import { Loader2, ShieldCheck, XCircle } from 'lucide-react';

// --- Configuration Data ---
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

// 🌟 CORRECTED MAPPING: Includes broader and common generic categories. 🌟
const CATEGORY_TO_DEPT_MAP = {
    // PUBLIC WORKS DEPT (Roads, Water, Sidewalks, Drainage)
    'Pothole': 'Public Works Dept',
    'Water Leak/Pipe Burst': 'Public Works Dept',
    'Water Leak': 'Public Works Dept', // Added generic 'Water Leak'
    'General Road Hazard (Oil Spill, Debris)': 'Public Works Dept',
    'Broken/Damaged Sidewalk/Curb': 'Public Works Dept',
    'Sewer/Drainage Backup': 'Public Works Dept',
    
    // SANITATION DEPT (Garbage, Illegal Dumping)
    'Illegal Dumping/Garbage': 'Sanitation Dept',
    'Garbage': 'Sanitation Dept', // Added generic 'Garbage'
    
    // ELECTRICAL/LIGHTING (Lights and Traffic Light power issues)
    'Street Light Outage': 'Electrical/Lighting',
    'Malfunctioning Traffic Light': 'Electrical/Lighting', 
    'Street Light': 'Electrical/Lighting', // Added generic 'Street Light'
    
    // TRAFFIC & TRANSPORT (Non-electrical traffic control)
    'Damaged/Missing Road Signage': 'Traffic & Transport',
    'Traffic': 'Traffic & Transport', // Added generic 'Traffic'

    // PARKS & RECREATION (Parks and Forestry)
    'Park/Playground Maintenance Issue': 'Parks & Recreation',
    'Park': 'Parks & Recreation', // Added generic 'Park'
    'Fallen/Hazardous Tree or Branch': 'Parks & Recreation',

    // POLICE/PUBLIC SAFETY (Noise, Animals, Homelessness, Non-Emergency Safety)
    'Excessive Noise/Public Disturbance': 'Police Department',
    'Stray/Dangerous Animals (Animal Control)': 'Police Department',
    'Non-Emergency Public Safety Concern': 'Police Department',
    'Encampment/Homelessness Concern': 'Police Department',
    'Police': 'Police Department', // Added generic 'Police'
    
    // FIRE & SAFETY 
    'Fire': 'Fire & Safety', // Added generic 'Fire'
    
    // CITIZEN SERVICES (General/Property and Unlisted Issues)
    'Issue with Public Building/Property': 'Citizen Services',
    'Other Unlisted City Issue': 'Citizen Services',
    'Other': 'Citizen Services', // Catch generic 'Other' category
};
// 🌟 END CORRECTED MAPPING 🌟

// --- Component for Calculation & Display ---
const DepartmentSatisfactionRate = ({ complaints }) => {

    // 1. Calculate and map ALL complaints to their assigned department
    const departmentComplaints = (complaints || []).map(c => {
        // Normalize the incoming category string for reliable lookup
        const incomingCategory = c?.category ? c.category.trim() : null;
        let assignedDept = 'Citizen Services'; 

        // Use the map for assignment
        if (incomingCategory && CATEGORY_TO_DEPT_MAP[incomingCategory]) {
            assignedDept = CATEGORY_TO_DEPT_MAP[incomingCategory];
        }
        
        // Ensure necessary keys exist for stable processing
        return { 
            ...c, 
            assignedDept,
            status: c.status || 'Registered', 
            verificationStatus: c.verificationStatus || 'Not Applicable' 
        };
    });

    // 2. Aggregate statistics for each department
    const deptStats = DEPARTMENT_OPTIONS.map(dept => {
        
        // Filter complaints only by the single, assigned department
        const deptComplaints = departmentComplaints.filter(c => c.assignedDept === dept.name);
        
        const total = deptComplaints.length;
        
        // Count issues that have reached Resolved status (Ready for/Completed verification)
        const totalReviewed = deptComplaints.filter(c => 
            c.status === 'Resolved' || c.status === 'Verified Complete' || c.verificationStatus === 'Verification Failed'
        ).length;
        
        const totalVerifiedComplete = deptComplaints.filter(c => c.status === 'Verified Complete').length;

        // Calculate rate: Verified Complete / Total Reviewed Issues
        const satisfactionRate = totalReviewed > 0 
            ? ((totalVerifiedComplete / totalReviewed) * 100).toFixed(0) 
            : 'N/A';
        
        return {
            ...dept,
            total,
            totalResolved: totalReviewed, 
            totalVerifiedComplete,
            satisfactionRate,
        };
    });

    return (
        <div className='mt-8 border border-gray-200 rounded-xl p-4 bg-gray-50'>
            <h3 className="text-2xl font-extrabold text-gray-800 mb-6 flex items-center">
                <ShieldCheck className='h-6 w-6 mr-3 text-red-500' /> Official Resolution Accountability
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {deptStats.map((dept) => (
                    <div key={dept.name} className="bg-white p-4 rounded-xl shadow border-l-4 border-red-500">
                        <p className="text-md font-semibold text-gray-700 truncate">{dept.name}</p>
                        <p className="text-3xl font-bold text-red-700 mt-1">
                            {dept.satisfactionRate === 'N/A' ? 'N/A' : `${dept.satisfactionRate}%`}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            {dept.totalResolved} Reviewed Issues
                            <br />
                            <span className='font-medium text-green-700'>({dept.totalVerifiedComplete} Verified by Owner)</span>
                        </p>
                    </div>
                ))}
            </div>
            <p className='text-xs text-gray-500 mt-6'>*The percentage reflects issues officially marked "Resolved" that achieved "Verified Complete" status via the **Original Submitter's** final approval.</p>
        </div>
    );
};
// --------------------------------------------------------------------------

const SuccessRatePage = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAllComplaints = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.getAllComplaints();
            setComplaints(response.complaints || []);
        } catch (err) {
            console.error('API Error:', err.response?.status, err.message);
            const status = err.response?.status;
            const errorMessage = (status === 401 || status === 403)
                ? 'Authorization failed. Please ensure you are logged in as an Administrator.'
                : 'Failed to load department statistics. Check server connection or logs.';
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllComplaints();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-xl text-gray-700">
                <Loader2 className="animate-spin h-8 w-8 text-red-500 mr-3" />
                Calculating Success Rates...
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto p-8 bg-red-100 text-red-700 rounded-lg flex items-center font-semibold">
                <XCircle className='h-6 w-6 mr-3'/>
                {error}
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8 my-5 sm:my-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
                City Accountability Scorecard
            </h1>
            <p className="text-gray-600 mb-8">
                Detailed breakdown of official resolution rates verified by citizens.
            </p>

            <DepartmentSatisfactionRate complaints={complaints} />
        </div>
    );
};

export default SuccessRatePage;