const db = require('../config/db.config');

const Student = {
  findByEmail: async (email) => {
    const [rows] = await db.query('SELECT * FROM student_master WHERE email = ?', [email]);
    return rows[0];
  },

  // Add more queries for student application here

  findById: async (id) => {
    const [rows] = await db.query('SELECT * FROM student_master WHERE id = ?', [id]);
    return rows[0];
  },

  findByAadhaar: async (aadhar) => {
    const [rows] = await db.query('SELECT id FROM student_master WHERE aadhar = ?', [aadhar]);
    return rows[0];
  },

  updateStep1: async (id, d) => {
    await db.query(
      `UPDATE student_master SET 
        student_name=?, dob=?, age=?, gender=?, aadhar=?, religion=?, community=?, caste=?, 
        admission_type=?, mother_tongue=?, nativity=?, citizenship=?, civic_native=? 
      WHERE id=?`,
      [
        d.fullName, d.dob, d.age || null, d.gender, d.aadhaar, d.religion, d.community, d.caste,
        d.admissionType, d.motherTongue, d.nativity || null, d.citizenship || null, d.civicNative || null, id
      ]
    );
  },

  updateStep2: async (id, d) => {
    await db.query(
      `UPDATE student_master SET mobile=?, email=?, alt_mobile=?, communication_address=?, permanent_address=? WHERE id=?`,
      [d.mobile || null, d.email, d.alternateMobile || null, d.commAddress, d.permAddress, id]
    );
  },

  updateStep3: async (id, d) => {
    await db.query(
      `UPDATE student_master SET father_name=?, mother_name=?, parent_occupation=?, parent_annual_income=? WHERE id=?`,
      [d.fatherName, d.motherName, d.parentOccupation, d.annualIncome, id]
    );
  },

  updateStep4: async (id, d) => {
    await db.query(
      `UPDATE student_master SET 
        last_institution_board=?, last_institution_register_no=?, last_institution_name=?, last_institution_district=?, last_institution_state=?,
        medium_of_instruction=?, civic_school_type=?,
        standard_studied=?, standard_school_name=?, standard_yop=?, standard_district=?, standard_state=?
      WHERE id=?`,
      [
        d.qualifyingBoard, d.registerNumber, d.lastInstitute, d.lastInstituteDistrict, d.lastInstituteState,
        d.mediumOfInstruction, d.civicSchoolType,
        d.standard_studied || null, d.standard_school_name || null, d.standard_yop || null, d.standard_district || null, d.standard_state || null,
        id
      ]
    );
  },

  updateStep6: async (id, d) => {
    await db.query(
      `UPDATE student_master SET differently_abled=?, ex_servicemen=?, eminent_sports=? WHERE id=?`,
      [
        d.isDifferentlyAbled ? 'Yes' : 'No',
        d.isExServiceman ? 'Yes' : 'No',
        d.isSportsPerson ? 'Yes' : 'No',
        id
      ]
    );
  },

  updateStep7: async (id, d) => {
    await db.query(
      `UPDATE student_master SET hostel_choice=?, womens_choice=?, college_choices=? WHERE id=?`,
      [
        d.hostelRequired ? 'yes' : 'no',
        d.womensHostel ? 'yes' : 'no',
        JSON.stringify(d.preferences || []),
        id
      ]
    );
  },

  updatePhoto: async (id, path) => {
    await db.query('UPDATE student_master SET photo=? WHERE id=?', [path, id]);
  },

  updateTC: async (id, path) => {
    await db.query('UPDATE student_master SET transfer_certificate=? WHERE id=?', [path, id]);
  },

  updateMarksheet: async (id, path) => {
    await db.query('UPDATE student_master SET marksheet_certificate=? WHERE id=?', [path, id]);
  },

  updateQualifyingMarksheet: async (id, path) => {
    await db.query('UPDATE student_master SET qualifying_marksheet_certificate=? WHERE id=?', [path, id]);
  },

  updateCommunity: async (id, path) => {
    await db.query('UPDATE student_master SET community_certificate=? WHERE id=?', [path, id]);
  },

  updateExperience: async (id, filePath) => {
    try {
      await db.query('UPDATE student_master SET experience_certificate=? WHERE id=?', [filePath, id]);
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR' || err.errno === 1054) {
        await db.query('UPDATE student_master SET experinece_certificate=? WHERE id=?', [filePath, id]);
      } else {
        throw err;
      }
    }
  },

  submit: async (id, paymentId = null) => {
    const appNo = `DOTE2026${Math.floor(1000 + Math.random() * 9000)}`;
    if (paymentId) {
      try {
        await db.query(
          'UPDATE student_master SET application_no=?, application_status=?, payment_id=? WHERE id=?',
          [appNo, 'Submitted', paymentId, id]
        );
      } catch (e) {
        if (e.code === 'ER_BAD_FIELD_ERROR' || e.errno === 1054) {
          await db.query('UPDATE student_master SET application_no=?, application_status=? WHERE id=?', [
            appNo,
            'Submitted',
            id,
          ]);
        } else {
          throw e;
        }
      }
    } else {
      await db.query('UPDATE student_master SET application_no=?, application_status=? WHERE id=?', [
        appNo,
        'Submitted',
        id,
      ]);
    }
    return appNo;
  },

  getCount: async () => {

    const [rows] = await db.query('SELECT COUNT(*) as total FROM student_master');
    return rows[0].total;
  },

  getCommunityBreakdown: async () => {
    const [rows] = await db.query(
      "SELECT COALESCE(community, 'Not Specified') as community, COUNT(*) as count FROM student_master GROUP BY community ORDER BY count DESC"
    );
    return rows;
  },

  getCasteBreakdown: async () => {
    const [rows] = await db.query(
      "SELECT COALESCE(caste, 'Not Specified') as caste, COUNT(*) as count FROM student_master GROUP BY caste ORDER BY count DESC"
    );
    return rows;
  },

  getSchoolTypeBreakdown: async () => {
    const [rows] = await db.query(
      "SELECT COALESCE(school_type, 'Not Specified') as school_type, COUNT(*) as count FROM student_master GROUP BY school_type ORDER BY count DESC"
    );
    return rows;
  },
};

module.exports = Student;
