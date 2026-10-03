const express = require('express');
const router = express.Router();
const { getStudents, getStudentById, createStudent, updateStudent, deleteStudent } = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes protected - admin and teacher can read, admin can write
router.route('/')
  .get(protect, getStudents)
  .post(protect, authorize('admin', 'teacher'), createStudent);

router.route('/:id')
  .get(protect, getStudentById)
  .put(protect, authorize('admin', 'teacher'), updateStudent)
  .delete(protect, authorize('admin'), deleteStudent);

module.exports = router;