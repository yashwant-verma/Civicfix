const jwt = require('jsonwebtoken');
require('dotenv').config();

// 🔒 Verify JWT and attach user data
exports.auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("🔹 Incoming Authorization Header:", authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token missing or malformed' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("✅ Token Decoded:", decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};


// 🛡️ Admin-only route guard
exports.isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Administrator privileges required.',
        });
    }
    next();
};

// 👤 Citizen-only route guard
exports.isCitizen = (req, res, next) => {
    if (!req.user || req.user.role !== 'citizen') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Citizen privileges required.',
        });
    }
    next();
};
