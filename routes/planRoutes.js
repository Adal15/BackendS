const express = require('express');
const router = express.Router();
const { selectPlan, getUserPlan } = require('../controllers/planController');
const { protect } = require('../middleware/authMiddleware');

router.post('/select', protect, selectPlan);
router.get('/current', protect, getUserPlan);
router.get('/test', (req, res) => res.json({ message: 'Plan routes are ALIVE 🚀' }));

module.exports = router;
