const db = require('../config/db.config');
const Institution = require('../models/institution.model');
const Master = require('../models/master.model');
const Student = require('../models/student.model');
const Application = require('../models/application.model');

const getDashboardStats = async (req, res) => {
  try {
    // Helper to safely execute queries that might fail due to missing columns/tables
    const safeQuery = async (query, params = []) => {
      try {
        const [rows] = await db.query(query, params);
        return rows;
      } catch (err) {
        console.warn(`[SafeQuery Warning] Query failed: ${query.substring(0, 50)}... Error: ${err.message}`);
        return [];
      }
    };

    const safeScalar = async (query, key, defaultValue = 0) => {
      try {
        const [[result]] = await db.query(query);
        return result ? result[key] : defaultValue;
      } catch (err) {
        console.warn(`[SafeScalar Warning] Query failed: ${query.substring(0, 50)}... Error: ${err.message}`);
        return defaultValue;
      }
    };

    // 1. Overview Totals (Crucial)
    const totalColleges     = await safeScalar('SELECT COUNT(*) AS totalColleges FROM institution_master', 'totalColleges');
    const totalStudents     = await safeScalar('SELECT COUNT(*) AS totalStudents FROM student_master', 'totalStudents');
    const totalUsers        = await safeScalar("SELECT COUNT(*) AS totalUsers FROM user_master WHERE role = 'admin'", 'totalUsers');
    const totalApplications = await safeScalar("SELECT COUNT(*) AS totalApplications FROM student_master WHERE application_no IS NOT NULL", 'totalApplications');

    // 2. Institution Types (Govt / Aided / Self-Finance)
    const insTypes = await safeQuery(
      "SELECT COALESCE(ins_type, 'Others') as label, COUNT(*) as count FROM institution_master GROUP BY ins_type"
    );

    // 3. Student Demographics (Community)
    const communityBreakdown = await safeQuery(
      "SELECT COALESCE(community, 'Not Specified') as community, COUNT(*) as count FROM student_master GROUP BY community ORDER BY count DESC"
    );

    // 4. Student Demographics (Religion)
    const religionBreakdown = await safeQuery(
      "SELECT COALESCE(religion, 'Not Specified') as religion, COUNT(*) as count FROM student_master GROUP BY religion ORDER BY count DESC"
    );

    // 5. Gender Distribution
    const genderBreakdown = await safeQuery(
      "SELECT COALESCE(gender, 'Not Specified') as gender, COUNT(*) as count FROM student_master GROUP BY gender"
    );

    // 6. Application Status Breakdown
    const statusBreakdown = await safeQuery(
      "SELECT COALESCE(application_status, 'Draft') as status, COUNT(*) as count FROM student_master GROUP BY application_status"
    );

    // 7. Timeline Data (Daily Trends - Last 30 Days)
    // We try to catch errors specifically here as 'created_at' or 'submitted_at' might be missing
    const timelineData = await safeQuery(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM student_master 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // 8. College Demographics
    const demographicsResult = await safeQuery(`
      SELECT 
        SUM(CASE WHEN ins_category LIKE '%Men%' THEN 1 ELSE 0 END) as mens,
        SUM(CASE WHEN ins_category LIKE '%Women%' THEN 1 ELSE 0 END) as womens,
        SUM(CASE WHEN ins_category LIKE '%Co-education%' OR ins_category LIKE '%Co-Ed%' THEN 1 ELSE 0 END) as coed,
        SUM(CASE WHEN ins_hostel = 'Yes' THEN 1 ELSE 0 END) as hostel,
        SUM(CASE WHEN ins_hostel = 'No' OR ins_hostel IS NULL THEN 1 ELSE 0 END) as nonHostel
      FROM institution_master
    `);
    const collegeDemographics = demographicsResult[0] || { mens: 0, womens: 0, coed: 0, hostel: 0, nonHostel: 0 };

    // 9. Recent Activity (Latest 5 Students)
    const recentActivity = await safeQuery(`
      SELECT student_name, COALESCE(application_no, 'Draft') as application_no, application_status, id 
      FROM student_master 
      ORDER BY id DESC 
      LIMIT 5
    `);

    res.status(200).json({
      success: true,
      stats: {
        totalColleges,
        totalStudents,
        totalUsers,
        totalApplications,
      },
      insTypes,
      communityBreakdown,
      religionBreakdown,
      genderBreakdown,
      statusBreakdown,
      timelineData,
      collegeDemographics,
      recentActivity
    });
  } catch (err) {
    console.error('Core Dashboard stats error:', err);
    res.status(500).json({ message: 'Failed to fetch core dashboard stats' });
  }
};

const getAllColleges = async (req, res) => {
  try {
    const colleges = await Institution.getAll();
    res.status(200).json({ success: true, colleges });
  } catch (err) {
    console.error('Fetch colleges error:', err);
    res.status(500).json({ message: 'Failed to fetch colleges data' });
  }
};

const addCollege = async (req, res) => {
  try {
    const { ins_code, ins_name } = req.body;
    if (!ins_code || !ins_name) {
      return res.status(400).json({ message: 'Institution Code and Name are required' });
    }
    const insertId = await Institution.create(req.body);
    res.status(201).json({ success: true, message: 'College added successfully', id: insertId });
  } catch (err) {
    console.error('Add college error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Institution with this code already exists' });
    }
    res.status(500).json({ message: 'Server error while adding college' });
  }
};

const updateCollege = async (req, res) => {
  try {
    const { insCode } = req.params;
    const affectedRows = await Institution.update(insCode, req.body);
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Institution not found' });
    }
    res.status(200).json({ success: true, message: 'College updated successfully' });
  } catch (err) {
    console.error('Update college error:', err);
    res.status(500).json({ message: 'Server error while updating college' });
  }
};

const deleteCollege = async (req, res) => {
  try {
    const { insCode } = req.params;
    const affectedRows = await Institution.delete(insCode);
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Institution not found' });
    }
    res.status(200).json({ success: true, message: 'College deleted successfully' });
  } catch (err) {
    console.error('Delete college error:', err);
    res.status(500).json({ message: 'Server error while deleting college' });
  }
};

const bulkDeleteColleges = async (req, res) => {
  try {
    const { insCodes } = req.body;
    if (!insCodes || !Array.isArray(insCodes) || insCodes.length === 0) {
      return res.status(400).json({ message: 'No institution codes provided' });
    }
    const affectedRows = await Institution.deleteMultiple(insCodes);
    res.status(200).json({ 
      success: true, 
      message: `${affectedRows} institutions deleted successfully` 
    });
  } catch (err) {
    console.error('Bulk delete error:', err);
    res.status(500).json({ message: 'Server error during bulk deletion' });
  }
};

const getMasterData = async (req, res) => {
  try {
    const [districts, communities] = await Promise.all([
      Master.getAllDistricts(),
      Master.getAllCommunities(),
    ]);
    let fees = [];
    try {
      fees = await Master.getAllFees();
    } catch (e) {
      console.warn('[getMasterData] fees_master:', e.message);
    }
    res.status(200).json({ success: true, districts, communities, fees });
  } catch (err) {
    console.error('Master data fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch master data' });
  }
};

const addMasterEntry = async (req, res) => {
  try {
    const { type, name, state } = req.body;
    let insertId;

    if (type === 'districts') {
      if (!name || !state) return res.status(400).json({ message: 'Name and State are required' });
      insertId = await Master.addDistrict(name, state);
    } else if (type === 'communities') {
      if (!name) return res.status(400).json({ message: 'Name is required' });
      insertId = await Master.addCommunity(name);
    } else if (type === 'fees') {
      const { community, fees } = req.body;
      if (!community || String(community).trim() === '') {
        return res.status(400).json({ message: 'Community is required' });
      }
      if (fees === undefined || fees === null || String(fees).trim() === '') {
        return res.status(400).json({ message: 'Fees amount is required' });
      }
      const n = Number(fees);
      if (!Number.isFinite(n) || n < 0) {
        return res.status(400).json({ message: 'Fees must be a non-negative number' });
      }
      insertId = await Master.addFee(community, n);
    } else {
      return res.status(400).json({ message: 'Invalid master data type' });
    }

    res.status(201).json({ success: true, message: 'Entry added successfully', id: insertId });
  } catch (err) {
    if (err.code === 'DUPLICATE_COMMUNITY') {
      return res.status(409).json({ message: err.message || 'Duplicate community' });
    }
    console.error('Add master data error:', err);
    res.status(500).json({ message: 'Failed to add master data entry' });
  }
};

const deleteMasterEntry = async (req, res) => {
  try {
    const { type, id } = req.params;
    let affectedRows;

    if (type === 'districts') {
      affectedRows = await Master.deleteDistrict(id);
    } else if (type === 'communities') {
      affectedRows = await Master.deleteCommunity(id);
    } else if (type === 'fees') {
      affectedRows = await Master.deleteFee(id);
    } else {
      return res.status(400).json({ message: 'Invalid master data type' });
    }

    if (affectedRows === 0) return res.status(404).json({ message: 'Entry not found' });
    res.status(200).json({ success: true, message: 'Entry deleted successfully' });
  } catch (err) {
    console.error('Delete master data error:', err);
    res.status(500).json({ message: 'Failed to delete master data entry' });
  }
};

const updateFeesMasterEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { community, fees } = req.body;
    if (!community || String(community).trim() === '') {
      return res.status(400).json({ message: 'Community is required' });
    }
    if (fees === undefined || fees === null || String(fees).trim() === '') {
      return res.status(400).json({ message: 'Fees amount is required' });
    }
    const n = Number(fees);
    if (!Number.isFinite(n) || n < 0) {
      return res.status(400).json({ message: 'Fees must be a non-negative number' });
    }
    const affected = await Master.updateFee(id, community, n);
    if (affected === 0) return res.status(404).json({ message: 'Entry not found' });
    res.status(200).json({ success: true, message: 'Fee updated successfully' });
  } catch (err) {
    if (err.code === 'DUPLICATE_COMMUNITY') {
      return res.status(409).json({ message: err.message || 'Duplicate community' });
    }
    console.error('Update fees master error:', err);
    res.status(500).json({ message: 'Failed to update fee entry' });
  }
};

const getStudentApplications = async (_req, res) => {
  try {
    const [columns] = await db.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'student_master'`
    );
    const availableColumns = new Set(columns.map((c) => c.COLUMN_NAME));

    const selectColumns = ['id'];
    const optionalColumns = [
      'application_no',
      'student_name',
      'email',
      'mobile',
      'gender',
      'community',
      'created_at',
      'last_institution_district',
      'college_choices',
      'photo',
      'marksheet_certificate',
      'qualifying_marksheet_certificate',
      'transfer_certificate',
      'community_certificate'
    ];

    optionalColumns.forEach((col) => {
      if (availableColumns.has(col)) {
        selectColumns.push(col);
      }
    });

    // Keep response shape stable even when some DB columns are absent.
    optionalColumns.forEach((col) => {
      if (!availableColumns.has(col)) {
        selectColumns.push(`NULL AS ${col}`);
      }
    });

    const whereClauses = [];
    if (availableColumns.has('application_no')) {
      whereClauses.push("application_no IS NOT NULL AND TRIM(application_no) <> ''");
    }
    if (availableColumns.has('application_status')) {
      whereClauses.push("LOWER(application_status) = 'submitted'");
    }

    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' OR ')}` : '';
    const orderBySQL = availableColumns.has('created_at') ? 'ORDER BY created_at DESC' : 'ORDER BY id DESC';

    const [applications] = await db.query(
      `SELECT
        ${selectColumns.join(',\n        ')}
      FROM student_master
      ${whereSQL}
      ${orderBySQL}`
    );

    res.status(200).json({ success: true, applications });
  } catch (err) {
    console.error('Fetch student applications error:', err);
    res.status(500).json({ message: 'Failed to fetch student applications' });
  }
};

const getStudentApplicationReport = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.application_no) {
      return res.status(400).json({ message: 'Student application is not submitted yet' });
    }

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

    res.status(200).json({
      success: true,
      student,
      marks: marks || null,
      completedSteps,
      isSubmitted: !!student.application_no,
      applicationNo: student.application_no,
    });
  } catch (err) {
    console.error('Fetch student application report error:', err);
    res.status(500).json({ message: 'Failed to fetch student application report' });
  }
};

module.exports = { 
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
};
