const express = require('express');
const router = express.Router();
const { adminLogin, getDashboardStats, getAllUsers, getAllReports, updateUserLimit, approvePlan, rejectPlan, getUpgradeHistory, getUserFullDetails } = require('../controllers/adminController');
const { adminProtect } = require('../middleware/adminAuth');

router.post('/login', adminLogin);
router.get('/dashboard', adminProtect, getDashboardStats);
router.get('/users', adminProtect, getAllUsers);
router.get('/reports', adminProtect, getAllReports);
router.get('/upgrade-history', adminProtect, getUpgradeHistory);
router.get('/users/:userId/details', adminProtect, getUserFullDetails);
router.put('/users/:userId/limit', adminProtect, updateUserLimit);
router.put('/users/:userId/approve-plan', adminProtect, approvePlan);
router.put('/users/:userId/reject-plan', adminProtect, rejectPlan);

module.exports = router;
