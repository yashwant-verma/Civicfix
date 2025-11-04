// File: src/pages/admin/SuccessRatePage.jsx

import React, { useEffect, useState } from 'react';
import * as api from '../../api/complaints';
import { Loader2, ShieldCheck, ThumbsUp, ThumbsDown } from 'lucide-react';

// 🚨 EXTENDED DEPARTMENT LIST (Matches the list in AdminDashboard.jsx) 🚨
const DEPARTMENT_OPTIONS = [
    { name: 'Public Works Dept', email: 'works@city.gov' },
    { name: 'Sanitation Dept', email: 'sanitation@city.gov' },
    { name: 'Traffic & Transport', email: 'traffic@city.gov' },
    { name: 'Electrical/Lighting', email: 'electric@city.gov' },
    { name: 'Parks & Recreation', email: 'parks@city.gov' },
    { name: 'Citizen Services', email: 'services@city.gov' },
    { name: 'Police Department', email: 'police@city.gov' }, // Added Police
    { name: 'Fire & Safety', email: 'fire@city.gov' }, // Added Fire
];

// 🚨 Department Satisfaction Calculation & Display (Owner Verification Logic) 🚨
const DepartmentSatisfactionRate = ({ complaints }) => {
    // Map based on categories.
    const deptMap = {
        Pothole: 'Public Works Dept',
        'Water Leak': 'Public Works Dept',
        Garbage: 'Sanitation Dept',
        'Street Light': 'Electrical/Lighting',
        'Traffic': 'Traffic & Transport',
        Park: 'Parks & Recreation',
        Police: 'Police Department',
        Fire: 'Fire & Safety',
        Other: 'Citizen Services',
    };
    
    const deptStats = DEPARTMENT_OPTIONS.map(dept => {
        const deptComplaints = complaints.filter(c => {
            const mappedDept = deptMap[c.category] || (c.category.toLowerCase().includes(dept.name.split(' ')[0].toLowerCase()) ? dept.name : null);
            return mappedDept === dept.name;
        });
        
        const totalResolved = deptComplaints.filter(c => c.status === 'Resolved' || c.status === 'Verified Complete').length;
        const totalVerifiedComplete = deptComplaints.filter(c => c.status === 'Verified Complete').length;

        const satisfactionRate = totalResolved > 0 
            ? ((totalVerifiedComplete / totalResolved) * 100).toFixed(0) 
            : 'N/A';
        
        return {
            ...dept,
            total: deptComplaints.length,
            totalResolved,
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
                            {dept.totalResolved} Resolved Issues
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
            setError('Failed to load department statistics.');
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
        return <div className="max-w-7xl mx-auto p-8 bg-red-100 text-red-700 rounded-lg">{error}</div>;
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