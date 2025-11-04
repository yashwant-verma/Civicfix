import axiosInstance from "./axiosInstance";

// ✅ Login User
export const login = async (formData) => {
  const response = await axiosInstance.post("/auth/login", formData);
  return response.data; // should contain { token, user }
};

// ✅ Register User
export const register = async (formData) => {
  const response = await axiosInstance.post("/auth/register", formData);
  return response.data;
};

// ✅ Get Current Logged-in User (uses token from localStorage)
export const getCurrentUser = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found");

  const response = await axiosInstance.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data.user; // backend should send { user: {...} }
};

// ✅ Logout User
export const logout = async () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
