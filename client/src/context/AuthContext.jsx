import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../api/auth';
import axiosInstance from '../api/axiosInstance';
import { Loader2 } from 'lucide-react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // Initial check for authentication status
    useEffect(() => {
        const checkAuthStatus = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Use getCurrentUser API call to validate token and fetch fresh user data
                    const currentUser = await api.getCurrentUser();
                    setUser(currentUser);
                    setIsAuthenticated(true);
                } catch (error) {
                    console.error("Token invalid or expired during check:", error);
                    // Force logout if token check fails
                    api.logout(); 
                    setUser(null);
                    setIsAuthenticated(false);
                }
            }
            setLoading(false);
        };
        checkAuthStatus();

        // Optional: Add a simple check when location changes (simulating app-wide token check)
        const tokenExpirationCheck = () => {
            if (localStorage.getItem('token') && !isAuthenticated && !loading) {
                checkAuthStatus();
            }
        };
        window.addEventListener('focus', tokenExpirationCheck);

        return () => {
            window.removeEventListener('focus', tokenExpirationCheck);
        };

    }, []);

    const login = async (formData) => {
        const response = await api.login(formData);
        const { token, user } = response;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        setUser(user);
        setIsAuthenticated(true);
        // Set default header for future requests in this session
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`; 
    };

    const register = async (formData) => {
        const response = await api.register(formData);
        const { token, user } = response;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        setUser(user);
        setIsAuthenticated(true);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    };

    const logout = () => {
        api.logout();
        setUser(null);
        setIsAuthenticated(false);
        delete axiosInstance.defaults.headers.common['Authorization'];
    };

    const value = {
        user,
        isAuthenticated,
        isAdmin: user?.role === 'admin',
        isCitizen: user?.role === 'citizen',
        loading,
        login,
        register,
        logout,
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <span className="ml-3 text-lg text-gray-600">Loading application...</span>
            </div>
        );
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
