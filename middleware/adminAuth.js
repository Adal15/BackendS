const jwt = require('jsonwebtoken');

const adminProtect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

            if (decoded.isAdmin) {
                req.admin = decoded;
                next();
            } else {
                res.status(403).json({ message: 'Not authorized as an admin' });
            }
        } catch (error) {
            console.error('Admin Auth Error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { adminProtect };
