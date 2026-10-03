const express = require('express');
const router  = express.Router();
const { getDashboardStats, getRecentActivities } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

// GET /api/dashboard/stats — admin and teacher can access
router.get('/stats',      protect, getDashboardStats);
router.get('/activities', protect, getRecentActivities);

module.exports = router;
