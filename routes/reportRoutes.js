const express = require('express');
const router = express.Router();
const { submitWebsite, getReport, getUserReports } = require('../controllers/reportController');
const { protect, flexibleProtect } = require('../middleware/authMiddleware');

router.post('/analyze', protect, submitWebsite);
router.get('/:id', flexibleProtect, getReport);
router.get('/', protect, getUserReports);

// 

module.exports = router;
