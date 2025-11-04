const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const path = require('path');

// Custom Modules
const connectDB = require('./config/dbConnect');
const { cloudinaryConnect } = require('./config/cloudinary');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// --- Database & Cloudinary Connections ---
connectDB();
cloudinaryConnect(); // ✅ FIX: Uncommented to initialize Cloudinary config

// --- Middleware ---
app.use(express.json());
app.use(cookieParser());
app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: '/tmp/',
        // Set a high limit for potential image uploads
        limits: { fileSize: 50 * 1024 * 1024 } 
    })
);

// ✅ Serve uploaded images (local fallback)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ CORS Configuration (Allow frontend access)
app.use(
    cors({
        origin: 'http://localhost:5173', // your React frontend
        credentials: true,
    })
);

// --- Routes ---
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/complaints', complaintRoutes);

// ✅ Default route
app.get('/', (req, res) => {
    res.send('🛠️ CivicFix Backend API is running...');
});

// ✅ 404 Handler for unknown routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.originalUrl}`,
    });
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
