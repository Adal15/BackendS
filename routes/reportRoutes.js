const express = require('express');
const router = express.Router();
const { submitWebsite, getReport, getUserReports } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.post('/analyze', protect, submitWebsite);
router.get('/:id', protect, getReport);
router.get('/', protect, getUserReports);

// 

module.exports = router;
app.get('/api', (req, res) => {
  res.send('API working 🚀');
});