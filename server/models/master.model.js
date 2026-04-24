const db = require('../config/db.config');

const Master = {
  getAllReligions: async () => {
    const [rows] = await db.query('SELECT id, religion AS religion_name FROM religion_master ORDER BY religion');
    return rows;
  },


  getAllCommunities: async () => {
    const [rows] = await db.query('SELECT id, community_name FROM community_master ORDER BY community_name');
    return rows;
  },

  getAllDistricts: async () => {
    const [rows] = await db.query('SELECT id, district_name, state_name FROM district_master ORDER BY district_name');
    return rows;
  },

  addCommunity: async (name) => {
    const [result] = await db.query('INSERT INTO community_master (community_name, created_at, updated_at) VALUES (?, NOW(), NOW())', [name]);
    return result.insertId;
  },

  deleteCommunity: async (id) => {
    const [result] = await db.query('DELETE FROM community_master WHERE id = ?', [id]);
    return result.affectedRows;
  },

  addDistrict: async (name, state) => {
    const [result] = await db.query('INSERT INTO district_master (district_name, state_name, created_at, updated_at) VALUES (?, ?, NOW(), NOW())', [name, state]);
    return result.insertId;
  },

  deleteDistrict: async (id) => {
    const [result] = await db.query('DELETE FROM district_master WHERE id = ?', [id]);
    return result.affectedRows;
  },

  getAllFees: async () => {
    const [rows] = await db.query(
      'SELECT id, community, fees FROM fees_master ORDER BY community ASC'
    );
    return rows;
  },

  addFee: async (community, fees) => {
    const c = String(community || '').trim();
    const amount = Math.round(Number(fees));
    if (!c) throw Object.assign(new Error('Community required'), { code: 'VALIDATION' });
    const [dup] = await db.query(
      'SELECT id FROM fees_master WHERE LOWER(TRIM(community)) = LOWER(?) LIMIT 1',
      [c]
    );
    if (dup.length) {
      const err = new Error('A fee entry already exists for this community');
      err.code = 'DUPLICATE_COMMUNITY';
      throw err;
    }
    const [result] = await db.query(
      'INSERT INTO fees_master (community, fees, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
      [c, amount]
    );
    return result.insertId;
  },

  updateFee: async (id, community, fees) => {
    const c = String(community || '').trim();
    const amount = Math.round(Number(fees));
    if (!c) throw Object.assign(new Error('Community required'), { code: 'VALIDATION' });
    const [dup] = await db.query(
      'SELECT id FROM fees_master WHERE LOWER(TRIM(community)) = LOWER(?) AND id <> ? LIMIT 1',
      [c, id]
    );
    if (dup.length) {
      const err = new Error('Another row already uses this community name');
      err.code = 'DUPLICATE_COMMUNITY';
      throw err;
    }
    const [result] = await db.query(
      'UPDATE fees_master SET community = ?, fees = ?, updated_at = NOW() WHERE id = ?',
      [c, amount, id]
    );
    return result.affectedRows;
  },

  deleteFee: async (id) => {
    const [result] = await db.query('DELETE FROM fees_master WHERE id = ?', [id]);
    return result.affectedRows;
  },

  addReligion: async (name) => {
    const [result] = await db.query('INSERT INTO religion_master (religion, created_at, updated_at) VALUES (?, NOW(), NOW())', [name]);
    return result.insertId;
  },

  deleteReligion: async (id) => {
    const [result] = await db.query('DELETE FROM religion_master WHERE id = ?', [id]);
    return result.affectedRows;
  },
};

module.exports = Master;
