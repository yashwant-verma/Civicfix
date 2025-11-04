import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Zap, Menu, X, LayoutDashboard, FileText, Send } from 'lucide-react';

const Header = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    // 🚨 NEW STATE for mobile menu visibility
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isAdmin = isAuthenticated && user?.role === 'admin';
    const isCitizen = isAuthenticated && user?.role === 'citizen';
    
    // Define navigation links based on user role (reused for desktop and mobile)
    const navLinks = useMemo(() => {
        if (isCitizen) {
            return [
                { name: 'Dashboard', path: '/citizen/dashboard', icon: LayoutDashboard },
                { name: 'My Reports', path: '/citizen/my-complaints', icon: FileText },
                { name: 'Submit Complaint', path: '/citizen/submit-complaint', icon: Send },
            ];
        } else if (isAdmin) {
            return [
                { name: 'Admin Dashboard', path: '/admin-dashboard', icon: LayoutDashboard },
            ];
        }
        return [];
    }, [isCitizen, isAdmin]);


    return (
        <header className="bg-white shadow-md sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo and App Name */}
                    {/* Adjusted text size for responsiveness */}
                    <Link to="/" className="flex items-center space-x-2 text-xl sm:text-2xl font-bold text-blue-600 hover:text-blue-800">
                        <Zap className="h-7 w-7 text-yellow-500" />
                        <span>CivicFix</span>
                    </Link>

                    {/* Desktop Navigation (Hidden on small screens) */}
                    <div className="hidden md:flex items-center space-x-6">
                        {/* Dynamic Links */}
                        <nav className="flex items-center space-x-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </nav>
                        
                        {/* Auth Actions (Desktop) */}
                        <div className="flex items-center space-x-3">
                            {isAuthenticated ? (
                                <>
                                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                                        <User className="h-4 w-4" />
                                        <span className="font-medium truncate hidden lg:inline">{user.name} ({user.role})</span>
                                        <span className="font-medium truncate inline lg:hidden">{user.name}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 bg-red-500 text-white rounded-lg flex items-center hover:bg-red-600 transition duration-150 text-sm whitespace-nowrap"
                                    >
                                        <LogOut className="h-4 w-4 mr-1" />
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium">Login</Link>
                                    <Link to="/register" className="py-1.5 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 text-sm font-medium">Register</Link>
                                </>
                            )}
                        </div>
                    </div>
                    
                    {/* Mobile Menu Button (Visible on mobile, hidden on md+) */}
                    <div className="md:hidden flex items-center">
                        {/* Show small Login/Logout button next to hamburger */}
                        {isAuthenticated ? (
                            <button
                                onClick={handleLogout}
                                className="p-1.5 bg-red-500 text-white rounded-lg flex items-center hover:bg-red-600 transition duration-150 text-sm whitespace-nowrap mr-3"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        ) : (
                            <Link to="/login" className="py-1.5 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 text-sm font-medium mr-3">Login</Link>
                        )}
                        
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            type="button"
                            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                            aria-controls="mobile-menu"
                            aria-expanded={isMobileMenuOpen}
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMobileMenuOpen ? (
                                <X className="block h-6 w-6" aria-hidden="true" />
                            ) : (
                                <Menu className="block h-6 w-6" aria-hidden="true" />
                            )}
                        </button>
                    </div>

                </div>
            </div>

            {/* Mobile Menu Content (Conditionally rendered) */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-gray-100" id="mobile-menu">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {/* Dynamic Links for Auth Users */}
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-gray-700 hover:bg-blue-50 hover:text-blue-600  px-3 py-2 rounded-md text-base font-medium flex items-center transition-colors"
                            >
                                <link.icon className="h-5 w-5 mr-3" />
                                {link.name}
                            </Link>
                        ))}

                        {/* Auth Status and Logout (Mobile Bottom) */}
                        {isAuthenticated && (
                            <div className="pt-4 mt-2 border-t border-gray-200 space-y-2">
                                <div className="px-3 flex items-center text-sm text-gray-500">
                                    <User className="h-4 w-4 mr-2" />
                                    <span>Signed in as: <strong className='text-gray-800'>{user.name}</strong> ({user.role})</span>
                                </div>
                                <button
                                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                                    className="w-full text-left flex items-center bg-red-500 text-white px-3 py-2 rounded-lg text-base font-medium hover:bg-red-600 transition duration-150"
                                >
                                    <LogOut className="h-5 w-5 mr-3" /> Logout
                                </button>
                            </div>
                        )}
                        
                        {/* Guest Action (If not authenticated) - Register link */}
                        {!isAuthenticated && (
                             <Link 
                                to="/register" 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="w-full text-left flex items-center bg-blue-600 text-white px-3 py-2 rounded-lg text-base font-medium hover:bg-blue-700 transition duration-150 mt-2"
                             >
                                Register
                             </Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;