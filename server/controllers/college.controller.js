const db = require('../config/db.config');
const Student = require('../models/student.model');
const Application = require('../models/application.model');
const SUCCESS_PAYMENT_STATES = ['paid', 'success', 'successful', 'completed', 'captured'];
const PAYMENT_STATUS_COLUMNS = ['payment_status', 'payment_state', 'payment_flag'];
const PAYMENT_AMOUNT_COLUMNS = ['paid_amount', 'payment_amount', 'application_fee_amount', 'application_amount', 'fee_amount', 'amount_paid'];

const resolveCollegeScopeFilter = async () => {
  const [rows] = await db.query('SHOW COLUMNS FROM student_master');
  const columns = new Set(rows.map((r) => r.Field));

  const conditions = [
    'application_no IS NOT NULL',
    "TRIM(application_no) <> ''",
  ];

  const paymentStatusCol = PAYMENT_STATUS_COLUMNS.find((c) => columns.has(c));
  const paymentAmountCol = PAYMENT_AMOUNT_COLUMNS.find((c) => columns.has(c));

  if (paymentStatusCol) {
    const states = SUCCESS_PAYMENT_STATES.map((s) => `'${s}'`).join(', ');
    conditions.push(`LOWER(COALESCE(${paymentStatusCol}, '')) IN (${states})`);
  } else if (paymentAmountCol) {
    conditions.push(`COALESCE(${paymentAmountCol}, 0) > 0`);
  }

  return conditions.join(' AND ');
};

const getDashboardStats = async (req, res) => {
  try {
    const collegeId = req.user.id;
    const searchPattern = `%${collegeId}%`;
    const scopedFilter = await resolveCollegeScopeFilter();

    const safeQuery = async (query, params = []) => {
      try {
        const [rows] = await db.query(query, params);
        return rows;
      } catch (err) {
        console.warn(`[SafeQuery Warning] Query failed. Error: ${err.message}`);
        return [];
      }
    };
    
    // 1. Overview Totals
    const [[{ totalApplications }]] = await db.query(
      `SELECT COUNT(*) AS totalApplications FROM student_master WHERE college_choices LIKE ? AND ${scopedFilter}`,
      [searchPattern]
    );

    // 2. Status Breakdown
    const [[{ approved }]] = await db.query(
      `SELECT COUNT(*) AS approved FROM student_master WHERE college_choices LIKE ? AND ${scopedFilter} AND application_status = ?`,
      [searchPattern, 'Approved']
    );
    const [[{ pendingReview }]] = await db.query(
      `SELECT COUNT(*) AS pendingReview FROM student_master WHERE college_choices LIKE ? AND ${scopedFilter} AND application_status = ?`,
      [searchPattern, 'Pending']
    );
    const [[{ rejected }]] = await db.query(
      `SELECT COUNT(*) AS rejected FROM student_master WHERE college_choices LIKE ? AND ${scopedFilter} AND application_status = ?`,
      [searchPattern, 'Rejected']
    );

    // 3. New Analytics: Timeline Data (Daily - last 30 days)
    const timelineData = await safeQuery(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM student_master 
      WHERE college_choices LIKE ? AND ${scopedFilter} AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [searchPattern]);

    // 4. New Analytics: Gender Breakdown
    const genderBreakdown = await safeQuery(`
      SELECT COALESCE(gender, 'Not Specified') as gender, COUNT(*) as count 
      FROM student_master 
      WHERE college_choices LIKE ? AND ${scopedFilter}
      GROUP BY gender
    `, [searchPattern]);

    // 5. New Analytics: District Breakdown (Top 10 Districts)
    const districtBreakdown = await safeQuery(`
      SELECT COALESCE(last_institution_district, 'Other') as label, COUNT(*) as count 
      FROM student_master 
      WHERE college_choices LIKE ? AND ${scopedFilter}
      GROUP BY last_institution_district
      ORDER BY count DESC
      LIMIT 10
    `, [searchPattern]);

    // 6. Recent Activity Peeks
    const [recentApplications] = await db.query(
      `SELECT * FROM student_master WHERE college_choices LIKE ? AND ${scopedFilter} ORDER BY created_at DESC LIMIT 5`,
      [searchPattern]
    );

    res.status(200).json({
      success: true,
      stats: {
        totalApplications,
        pendingReview,
        approved,
        rejected,
      },
      timelineData,
      genderBreakdown,
      districtBreakdown,
      recentApplications,
    });
  } catch (err) {
    console.error('College dashboard stats error:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard intelligence' });
  }
};

const getAllApplications = async (req, res) => {
  try {
    const collegeId = req.user.id;
    const searchPattern = `%${collegeId}%`;
    const scopedFilter = await resolveCollegeScopeFilter();
    
    const [applications] = await db.query(
      `SELECT *
       FROM student_master
       WHERE college_choices LIKE ?
         AND ${scopedFilter}
       ORDER BY created_at DESC`,
      [searchPattern]
    );
    res.status(200).json({ success: true, applications });
  } catch (err) {
    console.error('Fetch applications error:', err);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['Approved', 'Pending', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Update the record internally; this relies on the newly injected application_status DB column hook!
    await db.query(
      'UPDATE student_master SET application_status = ? WHERE id = ?', 
      [status, id]
    );
    
    res.status(200).json({ success: true, message: `Application ${status} successfully` });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ message: 'Failed to update application status' });
  }
};

const getStudentApplicationReport = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeCode = String(req.user?.id || '').trim();
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.application_no) {
      return res.status(400).json({ message: 'Student application is not submitted yet' });
    }

    let collegeChoices = [];
    if (student.college_choices) {
      try {
        const parsed = JSON.parse(student.college_choices);
        if (Array.isArray(parsed)) {
          collegeChoices = parsed.map((c) => String(c).trim()).filter(Boolean);
        }
      } catch {
        collegeChoices = String(student.college_choices)
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean);
      }
    }

    const hasAccess = collegeChoices.includes(collegeCode);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You are not authorized to view this application report' });
    }

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

    res.status(200).json({
      success: true,
      student,
      marks: marks || null,
      completedSteps,
      isSubmitted: !!student.application_no,
      applicationNo: student.application_no,
    });
  } catch (err) {
    console.error('College student application report error:', err);
    res.status(500).json({ message: 'Failed to fetch student application report' });
  }
};

module.exports = { getDashboardStats, getAllApplications, updateApplicationStatus, getStudentApplicationReport };
