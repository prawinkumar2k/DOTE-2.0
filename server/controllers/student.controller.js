const Student = require('../models/student.model');
const Application = require('../models/application.model');
const path = require('path');

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
      marks && (marks.sslc_att1_register_no || marks.hsc_att1_register_no || marks.iti_att1_register_no || marks.voc_att1_register_no) ? 1 : 0,
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
    const docType = req.query.docType;
    
    // Generate path based on document type
    const folder = docType === 'photo' ? 'photos' : 'documents';
    // Filename is now in format: ph001.jpg, tc001.pdf, marksheet001.pdf, community001.pdf
    const filename = req.file.filename;
    const filePath = `/uploads/student/${folder}/${filename}`;

    try {
      switch (docType) {
        case 'photo': await Student.updatePhoto(id, filePath); break;
        case 'tc': await Student.updateTC(id, filePath); break;
        case 'marksheet': await Student.updateMarksheet(id, filePath); break;
        case 'marksheetQualifying': await Student.updateQualifyingMarksheet(id, filePath); break;
        case 'community': await Student.updateCommunity(id, filePath); break;
        default:
          return res.status(400).json({ message: 'Invalid document type' });
      }
    } catch (dbErr) {
      if (docType === 'marksheetQualifying' && (dbErr.code === 'ER_BAD_FIELD_ERROR' || dbErr.errno === 1054)) {
        return res.status(500).json({
          message:
            'Database is missing column qualifying_marksheet_certificate on student_master. Run: ALTER TABLE student_master ADD COLUMN qualifying_marksheet_certificate VARCHAR(512) NULL;',
        });
      }
      throw dbErr;
    }

    res.json({ success: true, path: filePath, filename: filename });
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
    res.json({ success: true, applicationNo: appNo, message: 'Application submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getMe, saveStep, uploadDocument, submitApplication };
