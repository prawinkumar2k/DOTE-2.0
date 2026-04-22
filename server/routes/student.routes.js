const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../middleware/auth.middleware');
const { getMe, saveStep, uploadDocument, submitApplication } = require('../controllers/student.controller');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Photo goes to photos folder, others go to documents folder
    const docType = req.query.docType;
    const folder = docType === 'photo' ? 'photos' : 'documents';
    const uploadPath = path.join(__dirname, `../uploads/student/${folder}`);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const studentId = String(req.user.id).padStart(3, '0'); // Pad to 3 digits: 001, 002, etc.
    const docType = req.query.docType;
    
    // Document type abbreviations
    const typeMap = {
      'photo': 'ph',
      'tc': 'tc',
      'marksheet': 'marksheet',
      'marksheetQualifying': 'qualmarksheet',
      'community': 'community',
      'experience': 'experience'
    };
    
    const abbreviation = typeMap[docType] || docType;
    // Generate professional filename: ph001.jpg, tc001.pdf, marksheet001.pdf, etc.
    const filename = `${abbreviation}${studentId}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Invalid file size/type'));
  },
});

const router = express.Router();

router.use(protect, authorize('student'));

router.get('/me', getMe);
router.put('/step/:step', saveStep);
router.post('/upload', upload.single('file'), uploadDocument);
router.post('/submit', submitApplication);

module.exports = router;
