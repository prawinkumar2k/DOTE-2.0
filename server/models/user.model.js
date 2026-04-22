const db = require('../config/db.config');

const User = {
  findByUserId: async (userId) => {
    const [rows] = await db.query('SELECT * FROM user_master WHERE user_id = ?', [userId]);
    return rows[0];
  },

  create: async (userData) => {
    const { user_id, user_name, role, password } = userData;
    const [result] = await db.query(
      'INSERT INTO user_master (user_id, user_name, role, password, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [user_id, user_name, role, password]
    );
    return result.insertId;
  },

  // Add more queries as needed

  getAdminCount: async () => {
    const [rows] = await db.query("SELECT COUNT(*) as total FROM user_master WHERE role = 'admin'");
    return rows[0].total;
  },
};

module.exports = User;
