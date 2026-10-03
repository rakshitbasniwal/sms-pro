const express = require('express');
const router = express.Router();
const { getFees, getFeeById, createFee, updateFee, deleteFee, getFeeStats } = require('../controllers/feeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/stats', protect, getFeeStats);
router.route('/')
  .get(protect, getFees)
  .post(protect, authorize('admin'), createFee);
router.route('/:id')
  .get(protect, getFeeById)
  .put(protect, authorize('admin'), updateFee)
  .delete(protect, authorize('admin'), deleteFee);

module.exports = router;
