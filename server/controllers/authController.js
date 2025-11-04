const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// ✅ Register (Citizen only)
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ success: false, message: 'All fields required.' });

        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ success: false, message: 'User already exists.' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'citizen', // citizens only
        });

        const token = generateToken(newUser);
        newUser.password = undefined;

        res.status(201).json({
            success: true,
            message: 'Citizen registered successfully.',
            user: newUser,
            token,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
};

// ✅ Login (Citizen/Admin)
// ✅ Login (Strict role-based)
exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ success: false, message: 'Email, password, and role are required.' });
        }

        // 🔍 Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials.' });
        }

        // 🔐 Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials.' });
        }

        // 🚫 Role mismatch check
        if (user.role !== role) {
            return res.status(403).json({
                success: false,
                message: `Access denied, Please check your credentials and role.`,
            });
        }

        // ✅ Generate token
        const token = generateToken(user);
        user.password = undefined;

        res.status(200).json({
            success: true,
            message: `${user.role} login successful.`,
            user,
            token,
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};


// ✅ Get Current User
exports.getMe = async (req, res) => {
    try {
        // req.user is set by authMiddleware
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        res.status(200).json({ success: true, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error fetching user.' });
    }
};
