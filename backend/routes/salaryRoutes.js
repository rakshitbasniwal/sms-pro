const express = require('express');
const router  = express.Router();
const {
  getSalaries,
  getSalaryById,
  createSalary,
  updateSalary,
  deleteSalary,
  markSalaryAsPaid,
  getSalaryStats,
  getTeacherSalaryHistory,
} = require('../controllers/salaryController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Stats (before /:id to avoid conflict)
router.get('/stats',            protect, authorize('admin'), getSalaryStats);
router.get('/teacher/:teacherId', protect, getTeacherSalaryHistory);

// CRUD
router.route('/')
  .get(protect, authorize('admin', 'teacher'), getSalaries)
  .post(protect, authorize('admin'), createSalary);

router.route('/:id')
  .get(protect, getSalaryById)
  .put(protect, authorize('admin'), updateSalary)
  .delete(protect, authorize('admin'), deleteSalary);

// Mark as paid
router.patch('/:id/pay', protect, authorize('admin'), markSalaryAsPaid);

module.exports = router;
