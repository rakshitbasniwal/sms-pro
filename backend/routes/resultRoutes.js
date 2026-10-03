const express = require('express');
const router = express.Router();
const { getResults, getResultById, createResult, updateResult, deleteResult } = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getResults)
  .post(protect, authorize('admin', 'teacher'), createResult);

router.route('/:id')
  .get(protect, getResultById)
  .put(protect, authorize('admin', 'teacher'), updateResult)
  .delete(protect, authorize('admin'), deleteResult);

module.exports = router;
