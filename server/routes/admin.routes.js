const express = require('express');
const { 
  getDashboardStats, 
  getAllColleges, 
  addCollege, 
  updateCollege, 
  deleteCollege, 
  bulkDeleteColleges,
  getMasterData,
  addMasterEntry,
  deleteMasterEntry,
  updateFeesMasterEntry,
  getStudentApplications,
  getStudentApplicationReport
} = require('../controllers/admin.controller');
const { getApplicationReports, exportApplicationReport } = require('../controllers/adminReports.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard/stats', getDashboardStats);
router.get('/colleges', getAllColleges);
router.post('/add-college', addCollege);
router.put('/college/:insCode', updateCollege);
router.delete('/college/:insCode', deleteCollege);
router.post('/colleges/bulk-delete', bulkDeleteColleges);

router.get('/master-data', getMasterData);
router.post('/master-data', addMasterEntry);
router.put('/master-data/fees/:id', updateFeesMasterEntry);
router.delete('/master-data/:type/:id', deleteMasterEntry);
router.get('/student-applications', getStudentApplications);
router.get('/student-applications/:id/report', getStudentApplicationReport);

router.get('/reports', getApplicationReports);
router.get('/reports/export', exportApplicationReport);

module.exports = router;
