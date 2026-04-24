const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db.config');
const Institution = require('../models/institution.model');
const Student = require('../models/student.model');
const User = require('../models/user.model');
const { sendMail } = require('../services/mail.service');

/**
 * Helper: safely convert a DB password value to string.
 * MySQL2 can return BLOB/BINARY columns as Buffer — .toString() normalizes it.
 */
const toStr = (val) => (val ? val.toString() : null);

/** Normalize mobile for storage / lookup: last 10 digits when enough digits present, else digits-only string */
const normalizeMobile = (raw) => {
  const d = String(raw || '').replace(/\D/g, '');
  if (!d) return '';
  return d.length >= 10 ? d.slice(-10) : d;
};

const findStudentByLoginIdentifier = async (identifier) => {
  const raw = String(identifier || '').trim();
  if (!raw) return null;

  if (raw.includes('@')) {
    const [[row]] = await db.query(
      'SELECT * FROM student_master WHERE email IS NOT NULL AND LOWER(TRIM(email)) = LOWER(?) LIMIT 1',
      [raw]
    );
    return row || null;
  }

  const digits = raw.replace(/\D/g, '');
  const ten = digits.length >= 10 ? digits.slice(-10) : digits;
  const candidates = [...new Set([raw, digits, ten, ten ? `91${ten}` : '', ten ? `+91${ten}` : '', ten ? `+91 ${ten}` : ''].filter(Boolean))];

  const ph = candidates.map(() => '?').join(',');
  const [[row]] = await db.query(
    `SELECT * FROM student_master WHERE mobile IS NOT NULL AND (mobile IN (${ph}) OR REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(mobile,''),' ',''),'-',''),'(',''),')',''),'+','') = ? OR (LENGTH(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(mobile,''),' ',''),'-',''),'(',''),')',''),'+','')) >= 10 AND RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(mobile,''),' ',''),'-',''),'(',''),')',''),'+',''), 10) = ?)) LIMIT 1`,
    [...candidates, digits, ten]
  );
  return row || null;
};

const STUDENT_ADMISSION_TYPES = ['First Year', 'Lateral Entry', 'Part Time'];

const normalizeAdmissionType = (value) => {
  const raw = value != null ? String(value).trim() : '';
  if (raw === 'Lateral-1[12]' || raw === 'Lateral-2[ITI]' || raw === 'Lateral Entry (2nd Year)') {
    return 'Lateral Entry';
  }
  return raw;
};

const register = async (req, res) => {
  try {
    const { name, email, password, mobile, role, admissionType } = req.body;

    if (!name || !password || !role) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    const emailTrim = email != null && String(email).trim() !== '' ? String(email).trim() : null;
    const mobileRaw = mobile != null && String(mobile).trim() !== '' ? String(mobile).trim() : null;
    const mobileNorm = mobileRaw ? normalizeMobile(mobileRaw) : '';

    if (role === 'student') {
      if (!emailTrim || !mobileNorm) {
        return res.status(400).json({ message: 'Please provide both email address and mobile number' });
      }
    } else if (!emailTrim && !mobileNorm) {
      return res.status(400).json({ message: 'Please provide an email address or mobile number' });
    }

    if (emailTrim && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    if (role === 'student') {
      if (mobileNorm.length < 10) {
        return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
      }
    } else if (!emailTrim && mobileNorm.length < 10) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === 'student') {
      const admissionTrim = normalizeAdmissionType(admissionType);
      if (!admissionTrim || !STUDENT_ADMISSION_TYPES.includes(admissionTrim)) {
        return res.status(400).json({ message: 'Please select a valid admission category' });
      }

      if (emailTrim) {
        const [[byEmail]] = await db.query(
          'SELECT id FROM student_master WHERE email IS NOT NULL AND LOWER(TRIM(email)) = LOWER(?)',
          [emailTrim]
        );
        if (byEmail) {
          return res.status(409).json({ message: 'Student already registered with this email' });
        }
      }

      if (mobileNorm && mobileNorm.length >= 10) {
        const existingMobile = await findStudentByLoginIdentifier(mobileNorm);
        if (existingMobile) {
          return res.status(409).json({ message: 'Student already registered with this mobile number' });
        }
      }

      const emailInsert = emailTrim ? emailTrim.toLowerCase() : null;
      const mobileInsert = mobileNorm && mobileNorm.length >= 10 ? mobileNorm : null;

      // Create new student
      const [result] = await db.query(
        'INSERT INTO student_master (student_name, email, mobile, password, role, admission_type) VALUES (?, ?, ?, ?, ?, ?)',
        [name, emailInsert, mobileInsert, hashedPassword, 'student', admissionTrim]
      );

      const studentId = result.insertId;
      const token = jwt.sign(
        { id: studentId, role: 'student', name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      return res.status(201).json({
        success: true,
        message: 'Student registered successfully',
        token,
        user: { id: studentId, name, email: emailInsert, mobile: mobileInsert, role: 'student', admissionType: admissionTrim }
      });
    } else {
      return res.status(400).json({ message: 'Registration only available for students' });
    }
  } catch (err) {
    console.error('[Register error]', err);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { identifier, password, role } = req.body;

    if (!identifier || !password || !role) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    let authUser = null;
    let displayName = '';

    // ─── COLLEGE ────────────────────────────────────────────────────────────
    if (role === 'college') {
      const [[college]] = await db.query(
        'SELECT * FROM institution_master WHERE ins_code = ?',
        [identifier]
      );

      if (!college) {
        return res.status(401).json({
          message: `No college found with ins_code "${identifier}"`,
        });
      }

      const storedPassword = toStr(college.password);

      if (!storedPassword) {
        return res.status(401).json({ message: 'Password not set for this college account' });
      }

      let isMatch = false;
      if (storedPassword.startsWith('$2')) {
        // bcrypt hashed
        isMatch = await bcrypt.compare(password, storedPassword);
      } else {
        // plain text
        isMatch = password.trim() === storedPassword.trim();
      }

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      authUser = college;
      displayName = college.ins_name || college.ins_code;

    // ─── ADMIN ──────────────────────────────────────────────────────────────
    } else if (role === 'admin') {
      const [[userRecord]] = await db.query(
        'SELECT * FROM user_master WHERE user_id = ?',
        [identifier]
      );

      if (!userRecord) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (userRecord.role !== role) {
        return res.status(401).json({ message: `This account is not registered as ${role}` });
      }

      const storedPassword = toStr(userRecord.password);
      let isMatch = false;
      if (storedPassword && storedPassword.startsWith('$2')) {
        isMatch = await bcrypt.compare(password, storedPassword);
      } else {
        isMatch = password.trim() === (storedPassword || '').trim();
      }

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      authUser = userRecord;
      displayName = toStr(userRecord.user_name) || identifier;

    // ─── STUDENT ────────────────────────────────────────────────────────────
    } else if (role === 'student') {
      const student = await findStudentByLoginIdentifier(identifier);

      if (!student) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const storedPassword = toStr(student.password);
      let isMatch = false;
      if (storedPassword && storedPassword.startsWith('$2')) {
        isMatch = await bcrypt.compare(password, storedPassword);
      } else {
        isMatch = password.trim() === (storedPassword || '').trim();
      }

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      authUser = student;
      displayName = toStr(student.student_name) || identifier;

    } else {
      return res.status(400).json({ message: `Unknown role: ${role}` });
    }

    // Guard: should never be null here, but safety first
    if (!authUser) {
      return res.status(500).json({ message: 'Authentication failed unexpectedly' });
    }

    let tokenId;
    if (role === 'college') tokenId = authUser.ins_code;
    else if (role === 'admin') tokenId = authUser.user_id;
    else tokenId = authUser.id; // student: always use primary key

    const token = jwt.sign(
      { id: tokenId, role, name: displayName },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    const cookieOptions = {
      expires: new Date(Date.now() + Number(process.env.COOKIE_EXPIRE) * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    };

    res.status(200).cookie('token', token, cookieOptions).json({
      success: true,
      role,
      user: {
        id: tokenId,
        name: displayName,
        role,
      },
    });

  } catch (err) {
    console.error('[Login error]', err);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

const logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

/**
 * Change login password for the currently authenticated user (college / admin / student).
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    const cur = String(currentPassword || '').trim();
    const next = String(newPassword || '').trim();

    if (!cur || !next) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }

    const role = req.user.role;
    const minLen = role === 'college' ? 3 : 6;
    if (next.length < minLen) {
      return res.status(400).json({
        success: false,
        message:
          role === 'college'
            ? 'New password must be at least 3 characters'
            : 'New password must be at least 6 characters',
      });
    }
    if (cur === next) {
      return res.status(400).json({ success: false, message: 'New password must be different from the current password' });
    }

    const id = req.user.id;
    const hashedNew = await bcrypt.hash(next, 10);

    const verifyStored = async (storedPassword) => {
      const s = toStr(storedPassword);
      if (!s) return false;
      if (s.startsWith('$2')) {
        return bcrypt.compare(cur, s);
      }
      return cur === s.trim();
    };

    if (role === 'college') {
      const [[college]] = await db.query('SELECT password FROM institution_master WHERE ins_code = ? LIMIT 1', [id]);
      if (!college) {
        return res.status(404).json({ success: false, message: 'College account not found' });
      }
      const ok = await verifyStored(college.password);
      if (!ok) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
      await db.query('UPDATE institution_master SET password = ? WHERE ins_code = ?', [hashedNew, id]);
      return res.json({ success: true, message: 'Password updated successfully' });
    }

    if (role === 'admin') {
      const [[row]] = await db.query('SELECT password FROM user_master WHERE user_id = ? LIMIT 1', [id]);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Admin account not found' });
      }
      const ok = await verifyStored(row.password);
      if (!ok) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
      await db.query('UPDATE user_master SET password = ? WHERE user_id = ?', [hashedNew, id]);
      return res.json({ success: true, message: 'Password updated successfully' });
    }

    if (role === 'student') {
      const [[stu]] = await db.query('SELECT password FROM student_master WHERE id = ? LIMIT 1', [id]);
      if (!stu) {
        return res.status(404).json({ success: false, message: 'Student account not found' });
      }
      const ok = await verifyStored(stu.password);
      if (!ok) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
      await db.query('UPDATE student_master SET password = ? WHERE id = ?', [hashedNew, id]);
      return res.json({ success: true, message: 'Password updated successfully' });
    }

    return res.status(400).json({ success: false, message: 'Unsupported role' });
  } catch (err) {
    console.error('[changePassword]', err);
    res.status(500).json({ success: false, message: 'Server error while updating password' });
  }
};


/** Student-only: request password reset email (verification link). */
const studentForgotPassword = async (req, res) => {
  try {
    const emailRaw = req.body?.email != null ? String(req.body.email).trim() : '';
    if (!emailRaw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    const [[student]] = await db.query(
      'SELECT id, student_name, email FROM student_master WHERE email IS NOT NULL AND LOWER(TRIM(email)) = LOWER(?) LIMIT 1',
      [emailRaw]
    );

    const genericMsg =
      'If an account exists for this email, we have sent password reset instructions. Check your inbox and spam folder.';

    if (!student) {
      return res.json({ success: true, message: genericMsg });
    }

    const token = jwt.sign(
      { purpose: 'student_pwd_reset', studentId: student.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const frontend = String(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const resetLink = `${frontend}/student/reset-password?token=${encodeURIComponent(token)}`;

    let mailResult;
    try {
      mailResult = await sendMail({
        to: emailRaw,
        subject: 'DOTE Admission Portal — reset your password',
        text: `Hello,\n\nReset your password by opening this link (valid for 1 hour):\n${resetLink}\n\nIf you did not request this, ignore this email.`,
        html: `<p>Hello,</p><p>You requested to reset your password for the <strong>DOTE Admission Portal</strong> (student account).</p><p><a href="${resetLink}">Click here to set a new password</a></p><p>This link expires in one hour.</p><p>If you did not request this, you can ignore this email.</p>`,
      });
    } catch (mailErr) {
      console.error('[studentForgotPassword] SMTP send failed:', mailErr.message || mailErr);
      return res.status(502).json({
        success: false,
        message:
          'Could not send the email. The administrator must set valid SMTP settings in server/.env (SMTP_HOST, SMTP_USER, SMTP_PASS) and restart the API.',
      });
    }

    const payload = { success: true, message: genericMsg };
    if (process.env.NODE_ENV !== 'production' && mailResult && mailResult.skipped) {
      payload.devResetLink = resetLink;
      payload.devHint =
        'SMTP not configured — email was not sent. Use devResetLink locally only to test the reset page.';
    }

    res.json(payload);
  } catch (err) {
    console.error('[studentForgotPassword]', err);
    res.status(500).json({ success: false, message: 'Could not process request. Try again later.' });
  }
};

/** Student-only: complete reset using token from email link. */
const studentResetPasswordWithToken = async (req, res) => {
  try {
    const token = req.body?.token != null ? String(req.body.token).trim() : '';
    const newPassword = req.body?.newPassword != null ? String(req.body.newPassword).trim() : '';

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset link. Please request a new password reset from the login page.',
      });
    }

    if (decoded.purpose !== 'student_pwd_reset' || !decoded.studentId) {
      return res.status(400).json({ success: false, message: 'Invalid reset link' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    const [result] = await db.query('UPDATE student_master SET password = ? WHERE id = ?', [
      hashed,
      decoded.studentId,
    ]);

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    res.json({ success: true, message: 'Password updated. You can log in now.' });
  } catch (err) {
    console.error('[studentResetPasswordWithToken]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  logout,
  changePassword,
  studentForgotPassword,
  studentResetPasswordWithToken,
};

