const express = require('express');
const {
  register,
  login,
  logout,
  changePassword,
  studentForgotPassword,
  studentResetPasswordWithToken,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.post('/change-password', protect, changePassword);
router.post('/student/forgot-password', studentForgotPassword);
router.post('/student/reset-password', studentResetPasswordWithToken);

module.exports = router;
