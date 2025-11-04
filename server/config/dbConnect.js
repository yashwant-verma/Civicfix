// File: config/dbConnect.js

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`🎉 MongoDB Connected Successfully: ${conn.connection.host}`);
    } catch (err) {
        // This is a robust failure log if the connection string or network is wrong
        console.error(`❌ CRITICAL: MongoDB Connection Failed. Check MONGO_URI and IP access list. Error: ${err.message}`);
        
        // This line ensures the server stops if the DB is unavailable, preventing hanging queries.
        process.exit(1); 
    }
};

module.exports = connectDB;