import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, Loader2, UserCog } from "lucide-react";

const LoginPage = () => {
  const { isAuthenticated, user, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "citizen",
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
      await login(formData);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Check credentials or server connection."
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
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-blue-700">Sign In</h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center text-sm">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Role */}
          <div className="flex items-center space-x-2">
            <UserCog className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base"
            >
              <option value="citizen">Citizen</option>
              <option value="admin">Admin</option>
            </select>
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
              placeholder="Password"
              required
              className="w-full pl-10 pr-4 py-3 border rounded-lg text-base"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex justify-center text-lg font-semibold disabled:bg-gray-400"
          >
            {loading ? <Loader2 className="animate-spin h-6 w-6" /> : "Sign In"}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => navigate("/register")}
            className="text-blue-600 hover:underline text-sm"
          >
            Don’t have an account? Register Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;