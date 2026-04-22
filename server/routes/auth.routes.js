const express = require('express');
const {
  register,
  login,
  logout,
  changePassword,
  studentForgotPassword,
  studentResetPasswordWithToken,
  addCollege,
  getDashboardStats,
  getColleges,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.post('/change-password', protect, changePassword);
router.post('/student/forgot-password', studentForgotPassword);
router.post('/student/reset-password', studentResetPasswordWithToken);
router.post('/add-college', addCollege);
router.get('/dashboard-stats', getDashboardStats);
router.get('/colleges', getColleges);

module.exports = router;
