const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { selectPlan, getUserPlan } = require('../controllers/planController');
const { protect } = require('../middleware/authMiddleware');

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const userId = req.user ? req.user._id : 'unknown';
        cb(null, `${userId}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|pdf/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Images or PDFs Only!'));
        }
    }
});

// Middleware to handle Multer errors
const multerUpload = (req, res, next) => {
    console.log(`[Multer] Attempting upload for user: ${req.user?._id}`);
    
    // Explicitly initialize req.body if it's somehow missing from a previous middleware
    if (!req.body) req.body = {};

    upload.single('receipt')(req, res, (err) => {
        if (err) {
            const isMulterError = err instanceof multer.MulterError;
            console.error(`[Multer] ${isMulterError ? 'MulterError' : 'General Error'}: ${err.message}`);
            return res.status(400).json({ message: err.message });
        }
        
        // Ensure req.body is definitely there for the next step
        req.body = req.body || {};
        const filename = req.file ? req.file.filename : 'MISSING';
        const bodyKeys = Object.keys(req.body);
        
        console.log(`[Multer] Upload phase DONE: File: ${filename}, Body Fields: ${bodyKeys}`);
        next();
    });
};

router.post('/select', protect, multerUpload, selectPlan);
router.get('/current', protect, getUserPlan);
router.get('/test', (req, res) => res.json({ message: 'Plan routes are ALIVE 🚀' }));

module.exports = router;
