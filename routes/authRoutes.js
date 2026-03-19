const express = require('express');
const router = express.Router();
const { registerUser, authUser } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', authUser);
// Test route to verify the auth route is working
router.get('/', (req, res) => {
  res.send('Auth route working ✅');
});
module.exports = router;
