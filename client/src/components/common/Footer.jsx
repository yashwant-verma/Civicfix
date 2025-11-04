import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-gray-800 text-white mt-auto">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-sm">
                <p>&copy; {new Date().getFullYear()} CivicFix. All rights reserved. Built for citizen reporting.</p>
            </div>
        </footer>
    );
};

export default Footer;
