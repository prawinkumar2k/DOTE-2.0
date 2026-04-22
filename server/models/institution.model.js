const db = require('../config/db.config');

const Institution = {
  findByInsCode: async (insCode) => {
    const [rows] = await db.query('SELECT * FROM institution_master WHERE ins_code = ?', [insCode]);
    return rows[0];
  },

  create: async (data) => {
    const [result] = await db.query(
      `INSERT INTO institution_master 
        (ins_code, ins_name, ins_type, ins_type_id, ins_status, ins_district, ins_city, ins_state, ins_country, ins_pincode, ins_address, ins_principal, ins_phone_number, ins_principal_whatsapp_number, ins_principal_contact_number, ins_email_id_office, ins_email_id_principal, ins_web_url, role, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        data.ins_code, data.ins_name, data.ins_type, data.ins_type_id || null,
        data.ins_status, data.ins_district, data.ins_city, data.ins_state,
        data.ins_country, data.ins_pincode, data.ins_address, data.ins_principal,
        data.ins_phone_number, data.ins_principal_whatsapp_number, data.ins_principal_contact_number,
        data.ins_email_id_office, data.ins_email_id_principal, data.ins_web_url,
        data.role || 'college'
      ]
    );
    return result.insertId;
  },

  update: async (insCode, data) => {
    const [result] = await db.query(
      `UPDATE institution_master SET 
        ins_name=?, ins_type=?, ins_type_id=?, ins_status=?, ins_district=?, ins_city=?, 
        ins_state=?, ins_country=?, ins_pincode=?, ins_address=?, ins_principal=?, 
        ins_phone_number=?, ins_principal_whatsapp_number=?, ins_principal_contact_number=?, 
        ins_email_id_office=?, ins_email_id_principal=?, ins_web_url=?, updated_at=NOW()
      WHERE ins_code=?`,
      [
        data.ins_name, data.ins_type, data.ins_type_id || null,
        data.ins_status, data.ins_district, data.ins_city, data.ins_state,
        data.ins_country, data.ins_pincode, data.ins_address, data.ins_principal,
        data.ins_phone_number, data.ins_principal_whatsapp_number, data.ins_principal_contact_number,
        data.ins_email_id_office, data.ins_email_id_principal, data.ins_web_url,
        insCode
      ]
    );
    return result.affectedRows;
  },

  delete: async (insCode) => {
    const [result] = await db.query('DELETE FROM institution_master WHERE ins_code = ?', [insCode]);
    return result.affectedRows;
  },

  deleteMultiple: async (insCodes) => {
    const [result] = await db.query('DELETE FROM institution_master WHERE ins_code IN (?)', [insCodes]);
    return result.affectedRows;
  },
  getAll: async () => {
    const [rows] = await db.query('SELECT * FROM institution_master ORDER BY ins_code ASC');
    return rows;
  },

  getCount: async () => {
    const [rows] = await db.query('SELECT COUNT(*) as total FROM institution_master');
    return rows[0].total;
  },

  getCountByType: async (type) => {
    const [rows] = await db.query('SELECT COUNT(*) as total FROM institution_master WHERE ins_type = ?', [type]);
    return rows[0].total;
  },

  getDemographics: async () => {
    const [totalRows] = await db.query('SELECT COUNT(*) as total FROM institution_master');
    const total = totalRows[0].total;

    const [womensRows] = await db.query(
      "SELECT COUNT(*) as cnt FROM institution_master WHERE ins_name LIKE '%Women%' OR ins_name LIKE '%Girls%'"
    );
    const womens = womensRows[0].cnt;

    const [mensRows] = await db.query(
      "SELECT COUNT(*) as cnt FROM institution_master WHERE ins_name REGEXP '\\\\b(Men|Mens|Boys)\\\\b'"
    );
    const mens = mensRows[0].cnt;

    const coed = total - womens - mens;

    return {
      mens,
      womens,
      coed,
      hostel: 'N/A',
      nonHostel: 'N/A'
    };
  },
};

module.exports = Institution;
