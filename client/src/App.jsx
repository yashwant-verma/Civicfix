import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
// FIX: Adding explicit .jsx extension to resolve module errors
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

// Common Components
import Header from "./components/common/Header.jsx";
import Footer from "./components/common/Footer.jsx";

// Pages
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import SubmitComplaint from "./pages/citizen/SubmitComplaint.jsx";
import MyComplaints from "./pages/citizen/MyComplaints.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import CitizenDashboard from "./pages/citizen/CitizenDashboard.jsx";
// 🚨 NEW PAGE IMPORT 🚨
import SuccessRatePage from "./pages/admin/SuccessRatePage.jsx"; 
import { Loader2 } from "lucide-react"; // Import Loader2

// 🔒 Protected Route for Authenticated Users
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-xl text-gray-700">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2">Loading authentication...</span>
            </div>
        );
    }

    // If not authenticated, redirect to login page
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// 🔒 Admin Route
const AdminRoute = ({ children }) => {
    const { isAuthenticated, isAdmin, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-xl text-gray-700">
                <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                <span className="ml-2">Verifying admin access...</span>
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    // Redirect non-admins to the citizen dashboard
    if (!isAdmin) return <Navigate to="/citizen/dashboard" replace />;

    return children;
};

// 🧭 Role-Based Dashboard Redirect
const DashboardRedirect = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-xl text-gray-700">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-2">Determining dashboard...</span>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    
    // Ensure correct and full path is used for navigation
    return user.role === "admin"
        ? <Navigate to="/admin-dashboard" replace />
        : <Navigate to="/citizen/dashboard" replace />; // Use full path defined in routes
};

// 🌐 Main Layout
const AppContent = () => (
    <div className="flex flex-col min-h-screen bg-gray-50 font-inter">
        <Header />
        <main className="flex-grow">
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<DashboardRedirect />} /> 
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Citizen Routes */}
                <Route
                    path="/citizen/dashboard"
                    element={<ProtectedRoute><CitizenDashboard /></ProtectedRoute>}
                />
                <Route
                    path="/citizen/my-complaints"
                    element={<ProtectedRoute><MyComplaints /></ProtectedRoute>}
                />
                <Route
                    path="/citizen/submit-complaint"
                    element={<ProtectedRoute><SubmitComplaint /></ProtectedRoute>}
                />

                {/* Admin Routes */}
                <Route
                    path="/admin-dashboard"
                    element={<AdminRoute><AdminDashboard /></AdminRoute>}
                />
                {/* 🚨 NEW SUCCESS RATE ROUTE FIX 🚨 */}
                <Route
                    path="/admin/success-rate"
                    element={<AdminRoute><SuccessRatePage /></AdminRoute>}
                />
                {/* ----------------------------- */}

                {/* 404 Fallback */}
                <Route
                    path="*"
                    element={
                        <div className="p-10 text-center min-h-screen flex flex-col items-center justify-center">
                            <h1 className="text-6xl font-extrabold text-red-600">404</h1>
                            <h2 className="text-3xl font-bold text-gray-800 mt-2">Page Not Found</h2>
                            <p className="mt-4 text-lg text-gray-600">
                                The requested URL was not found. Please check the address or use the navigation.
                            </p>
                            <Link to="/" className="mt-6 inline-block text-blue-600 hover:underline font-semibold">
                                Go to Home
                            </Link>
                        </div>
                    }
                />
            </Routes>
        </main>
        <Footer />
    </div>
);

// 🌍 Root App Wrapper
const App = () => (
    <Router>
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    </Router>
);

export default App;
