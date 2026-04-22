const db = require('../config/db.config');

const Application = {
  findByStudentId: async (studentId) => {
    const [rows] = await db.query('SELECT * FROM mark_details WHERE student_id = ?', [studentId]);
    return rows[0];
  },

  upsertMarks: async (studentId, data) => {
    const validQualifiers = ['sslc', 'hsc', 'iti', 'voc'];

    // Strict filter: Key must be a flag (e.g., 'hsc') or start with a prefix (e.g., 'hsc_')
    const entries = Object.entries(data).filter(([key]) => {
      const lowerKey = key.toLowerCase();
      const isFlag = validQualifiers.includes(lowerKey);
      const hasPrefix = validQualifiers.some(q => lowerKey.startsWith(`${q}_`));
      return (isFlag || hasPrefix) && key !== 'student_id';
    });

    if (entries.length === 0) {
      console.warn(`No valid mark details found for student ${studentId}. Data:`, data);
      return;
    }

    // Check if a record already exists for this student
    const [existing] = await db.query('SELECT id FROM mark_details WHERE student_id = ? LIMIT 1', [studentId]);

    if (existing.length > 0) {
      // Record exists — UPDATE it
      const setClauses = entries.map(([key]) => `${key} = ?`).join(', ');
      const updateValues = [...entries.map(e => e[1]), studentId];
      await db.execute(
        `UPDATE mark_details SET ${setClauses} WHERE student_id = ?`,
        updateValues
      );
    } else {
      // No record — INSERT a new one
      const keys = ['student_id', ...entries.map(e => e[0])];
      const values = [studentId, ...entries.map(e => e[1])];
      const placeholders = keys.map(() => '?').join(', ');
      await db.execute(
        `INSERT INTO mark_details (${keys.join(', ')}) VALUES (${placeholders})`,
        values
      );
    }
  },

  upsertStep5: async (studentId, data) => {
    await Application.upsertMarks(studentId, data);
  },

  upsertStep6: async (studentId, data) => {
    await Application.upsertMarks(studentId, data);
  },
  getCollegeList: async ({ search = '', city = '', type = '' } = {}) => {
    let query = `
      SELECT ins_code, ins_name, ins_city, ins_district, ins_type, ins_category, ins_hostel, ins_status
      FROM institution_master
      WHERE ins_type_id IN (1, 2)
        AND ins_status = 1
    `;
    const params = [];
    if (search) { query += ' AND ins_name LIKE ?';  params.push(`%${search}%`); }
    if (city)   { query += ' AND ins_city = ?';     params.push(city); }
    if (type && [1, 2].includes(Number(type))) {
      query += ' AND ins_type_id = ?';
      params.push(Number(type));
    }
    query += ' ORDER BY ins_code ASC LIMIT 500';
    const [rows] = await db.query(query, params);
    return rows;
  },
};

module.exports = Application;
