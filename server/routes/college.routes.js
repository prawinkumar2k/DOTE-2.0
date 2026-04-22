const express = require('express');
const { getDashboardStats, getAllApplications, updateApplicationStatus, getStudentApplicationReport } = require('../controllers/college.controller');
const { getCollegeApplicationReports, exportCollegeApplicationReport } = require('../controllers/collegeReports.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const router = express.Router();

router.use(protect);
router.use(authorize('college'));

router.get('/dashboard/stats', getDashboardStats);
router.get('/applications', getAllApplications);
router.get('/applications/:id/report', getStudentApplicationReport);
router.put('/applications/:id/status', updateApplicationStatus);

router.get('/reports', getCollegeApplicationReports);
router.get('/reports/export', exportCollegeApplicationReport);

module.exports = router;
