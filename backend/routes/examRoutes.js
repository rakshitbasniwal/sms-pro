const express = require('express');
const router = express.Router();
const { getExams, getExamById, createExam, updateExam, deleteExam, togglePublish } = require('../controllers/examController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getExams)
  .post(protect, authorize('admin', 'teacher'), createExam);

router.patch('/:id/publish', protect, authorize('admin', 'teacher'), togglePublish);

router.route('/:id')
  .get(protect, getExamById)
  .put(protect, authorize('admin', 'teacher'), updateExam)
  .delete(protect, authorize('admin'), deleteExam);

module.exports = router;
