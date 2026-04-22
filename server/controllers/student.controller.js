const Student = require('../models/student.model');
const Application = require('../models/application.model');
const db = require('../config/db.config');
const path = require('path');
const fs = require('fs');

const DOC_FOLDER_MAP = {
  photo: 'photo',
  marksheet: 'marksheet',
  community: 'community',
  tc: 'transfer',
  experience: 'experience',
};

const DOC_HANDLER_MAP = {
  photo: 'updatePhoto',
  marksheet: 'updateMarksheet',
  community: 'updateCommunity',
  tc: 'updateTC',
  experience: 'updateExperience',
};

const getStudentDocumentBase = (student) => {
  const raw = String(student?.application_no || '').trim();
  return raw || `student-${student?.id || 'draft'}`;
};

const detectQualifyingType = (marks) => {
  if (!marks) return '';
  if (marks.iti || marks.iti_subject1 || marks.iti_att1_register_no) return 'ITI';
  if (marks.hsc || marks.hsc_subject1 || marks.hsc_att1_register_no) return 'HSC';
  if (marks.sslc || marks.sslc_subject1 || marks.sslc_att1_register_no) return 'SSLC';
  return '';
};

const remapDocumentPathsToApplicationNo = async (studentId, oldBase, newBase) => {
  const [columns] = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'student_master'`
  );
  const available = new Set(columns.map((c) => c.COLUMN_NAME));
  const trackedColumns = [
    'photo',
    'transfer_certificate',
    'marksheet_certificate',
    'qualifying_marksheet_certificate',
    'community_certificate',
    'experience_certificate',
    'experinece_certificate',
  ];

  const oldPrefix = `/uploads/${oldBase}/`;
  const newPrefix = `/uploads/${newBase}/`;
  const setClauses = [];
  const params = [];

  trackedColumns.forEach((column) => {
    if (!available.has(column)) return;
    setClauses.push(`${column} = CASE WHEN ${column} LIKE ? THEN REPLACE(${column}, ?, ?) ELSE ${column} END`);
    params.push(`${oldPrefix}%`, oldPrefix, newPrefix);
  });

  if (!setClauses.length) return;

  params.push(studentId);
  await db.query(`UPDATE student_master SET ${setClauses.join(', ')} WHERE id = ?`, params);
};

const getMe = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const marks = await Application.findByStudentId(student.id);

    const completedSteps = [
      student.student_name && student.dob && student.gender ? 1 : 0,
      student.email && student.communication_address ? 1 : 0,
      student.father_name && student.mother_name ? 1 : 0,
      student.last_institution_board && student.last_institution_name ? 1 : 0,
      marks && (marks.sslc_att1_register_no || marks.hsc_att1_register_no || marks.iti_att1_register_no) ? 1 : 0,
      student.differently_abled !== null ? 1 : 0,
      student.college_choices ? 1 : 0,
      student.photo ? 1 : 0,
    ].filter(Boolean).length;

    res.json({
      success: true,
      student,
      marks: marks || null,
      completedSteps,
      isSubmitted: !!student.application_no,
      applicationNo: student.application_no,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const saveStep = async (req, res) => {
  try {
    const step = parseInt(req.params.step);
    const id = req.user.id;
    const data = req.body;

    switch (step) {
      case 1: await Student.updateStep1(id, data); break;
      case 2: await Student.updateStep2(id, data); break;
      case 3: await Student.updateStep3(id, data); break;
      case 4: await Student.updateStep4(id, data); break;
      case 5: await Application.upsertStep5(id, data); break;
      case 6: await Student.updateStep6(id, data); break;
      case 7: await Student.updateStep7(id, data); break;
      case 8: /* Uploads handled separately via /api/student/upload */ break;
      default: return res.status(400).json({ message: 'Invalid step' });
    }

    res.json({ success: true, message: `Step ${step} saved` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const id = req.user.id;
    const docType = String(req.query.docType || '').trim();
    const folder = DOC_FOLDER_MAP[docType];

    if (!folder) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ message: 'Invalid document type' });
    }

    if (req.file.size < 150 * 1024) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ message: 'Invalid file size/type' });
    }

    const student = await Student.findById(id);
    if (!student) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(404).json({ message: 'Student not found' });
    }

    const marks = await Application.findByStudentId(id);
    const qualifyingType = detectQualifyingType(marks);
    if (docType === 'experience' && qualifyingType !== 'ITI') {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ message: 'Experience certificate is required only for ITI admissions' });
    }

    const baseName = getStudentDocumentBase(student);
    const finalDir = path.join(__dirname, '..', 'uploads', baseName, folder);
    await fs.promises.mkdir(finalDir, { recursive: true });

    const ext = path.extname(req.file.originalname).toLowerCase();
    const finalName = `${folder}${ext}`;
    const finalPath = path.join(finalDir, finalName);

    const existingFiles = await fs.promises.readdir(finalDir).catch(() => []);
    await Promise.all(
      existingFiles
        .filter(file => file.startsWith(folder))
        .map(file => fs.promises.unlink(path.join(finalDir, file)).catch(() => {}))
    );

    await fs.promises.rename(req.file.path, finalPath);

    const relativePath = `/uploads/${encodeURIComponent(baseName)}/${folder}/${finalName}`;
    const updateMethod = DOC_HANDLER_MAP[docType];
    try {
      await Student[updateMethod](id, relativePath);
    } catch (dbErr) {
      await fs.promises.unlink(finalPath).catch(() => {});
      if ((dbErr.code === 'ER_BAD_FIELD_ERROR' || dbErr.errno === 1054) && docType === 'experience') {
        return res.status(500).json({
          message:
            'Database is missing experience certificate column on student_master. Run: ALTER TABLE student_master ADD COLUMN experience_certificate VARCHAR(512) NULL;',
        });
      }
      throw dbErr;
    }

    res.json({ success: true, path: relativePath, filename: finalName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const submitApplication = async (req, res) => {
  try {
    const id = req.user.id;
    const student = await Student.findById(id);
    
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    // Check if already submitted
    if (student.application_no) {
      return res.json({ success: true, applicationNo: student.application_no, message: 'Already submitted' });
    }

    // Check if Aadhaar is already used by another student
    if (student.aadhar) {
      const existingAadhaar = await Student.findByAadhaar(student.aadhar);
      if (existingAadhaar && existingAadhaar.id !== id) {
        return res.status(409).json({ 
          success: false, 
          message: 'This Aadhaar number has already been used for another application. Each Aadhaar can only be used once.' 
        });
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Aadhaar number is required to submit application' 
      });
    }

    const paymentId = req.body && req.body.paymentId != null ? String(req.body.paymentId).trim() : null;
    const appNo = await Student.submit(id, paymentId || null);

    const draftDir = path.join(__dirname, '..', 'uploads', `student-${id}`);
    const finalDir = path.join(__dirname, '..', 'uploads', appNo);
    if (fs.existsSync(draftDir) && !fs.existsSync(finalDir)) {
      await fs.promises.rename(draftDir, finalDir).catch(() => {});
      await remapDocumentPathsToApplicationNo(id, `student-${id}`, appNo).catch(() => {});
    }

    res.json({ success: true, applicationNo: appNo, message: 'Application submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getMe, saveStep, uploadDocument, submitApplication };
