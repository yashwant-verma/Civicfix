import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, User, Loader2 } from "lucide-react";

const RegisterPage = () => {
    const { isAuthenticated, user, register, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isAuthenticated && user) {
            const redirectTo =
                user.role === "admin" ? "/admin-dashboard" : "/citizen/dashboard";
            navigate(redirectTo, { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await register(formData);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Registration failed. Check if user already exists or server connection."
            );
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Initializing...</span>
            </div>
        );
    }

    return (
        // Responsive container: ensures min-height and centralizes content
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-sm sm:max-w-md p-6 sm:p-8 bg-white rounded-xl shadow-2xl">
                <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-green-700">Join CivicFix</h2>

                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center text-sm">
                        {error}
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                    {/* Name */}
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Full Name"
                            required
                            className="w-full pl-10 pr-4 py-3 border rounded-lg text-base"
                        />
                    </div>

                    {/* Email */}
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Email Address"
                            required
                            className="w-full pl-10 pr-4 py-3 border rounded-lg text-base"
                        />
                    </div>

                    {/* Password */}
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Password (Min 6 characters)"
                            required
                            min="6"
                            className="w-full pl-10 pr-4 py-3 border rounded-lg text-base"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex justify-center text-lg font-semibold disabled:bg-gray-400"
                    >
                        {loading ? <Loader2 className="animate-spin h-6 w-6" /> : "Register as Citizen"}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <Link
                        to="/login"
                        className="text-blue-600 hover:underline text-sm"
                    >
                        Already have an account? Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;