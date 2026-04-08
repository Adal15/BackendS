const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;
    console.log(`[Auth] Incoming request to ${req.originalUrl} with headers:`, req.headers.authorization);
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            console.log(`[Auth] Extracted token: ${token.substring(0, 15)}...`);
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            console.log(`[Auth] Decoded JWT ID: ${decoded.id}`);
            
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user && decoded.email) {
                console.log(`[Auth] User not found by ID ${decoded.id}, trying email ${decoded.email}...`);
                req.user = await User.findOne({ email: decoded.email }).select('-password');
            }
            if (!req.user) {
                console.error(`[Auth] User lookup completely FAILED for ID: ${decoded.id}, Email: ${decoded.email}`);
                return res.status(401).json({ message: 'Not authorized, user not found or has been deleted' });
            }
            
            console.log(`[Auth] User authenticated successfully: ${req.user.email} (${req.user._id})`);
            return next();
        } catch (error) {
            console.error('[Auth] Token verification failed:', error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    
    if (!token) {
        console.log('[Auth] No token provided in headers');
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const flexibleProtect = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            
            // Case 1: Standard User
            if (decoded.id) {
                req.user = await User.findById(decoded.id).select('-password');
                if (!req.user && decoded.email) {
                    req.user = await User.findOne({ email: decoded.email }).select('-password');
                }
                if (req.user) {
                    return next();
                }
            }

            // Case 2: Admin
            if (decoded.isAdmin) {
                req.admin = decoded;
                return next();
            }

            return res.status(401).json({ message: 'Not authorized, invalid token claims' });
        } catch (error) {
            console.error('[FlexibleAuth] Error:', error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect, flexibleProtect };
