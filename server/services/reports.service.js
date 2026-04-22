const db = require('../config/db.config');
const XLSX = require('xlsx');

const CANDIDATE_AMOUNT_COLUMNS = ['paid_amount', 'payment_amount', 'application_fee_amount', 'application_amount', 'fee_amount', 'amount_paid'];
const CANDIDATE_PAYMENT_STATUS_COLUMNS = ['payment_status', 'payment_state', 'payment_flag'];
const SUCCESS_PAYMENT_STATES = ['paid', 'success', 'successful', 'completed', 'captured'];

const TYPE_LABELS = {
  date: 'Date',
  date_collection: 'Date',
  gender: 'Gender',
  community: 'Community',
  college: 'College',
  college_collection: 'College',
  district: 'District (last institution)',
  hostel: 'Hostel requirement',
};

const REPORT_TYPES_ADMIN = ['date', 'date_collection', 'gender', 'community', 'college', 'college_collection', 'district', 'hostel'];
const REPORT_TYPES_COLLEGE = ['date', 'date_collection', 'gender', 'community', 'district', 'hostel'];

let studentMasterColumnsCache = null;

function parseFilters(query) {
  const dateFrom = query.dateFrom || null;
  const dateTo = query.dateTo || null;
  const submittedOnly = query.submittedOnly === 'true' || query.submittedOnly === '1';
  const paidOnly = query.paidOnly === 'true' || query.paidOnly === '1';
  return { dateFrom, dateTo, submittedOnly, paidOnly };
}

function buildWhereClause(filters) {
  const parts = ['1=1'];
  const params = [];
  if (filters.submittedOnly) {
    parts.push('application_no IS NOT NULL');
  }
  if (filters.dateFrom) {
    parts.push('DATE(created_at) >= ?');
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    parts.push('DATE(created_at) <= ?');
    params.push(filters.dateTo);
  }
  return { where: parts.join(' AND '), params };
}

function applyCollegeScope(insCode, where, params) {
  if (!insCode) return { where, params };
  return {
    where: `${where} AND college_choices LIKE ?`,
    params: [...params, `%${String(insCode)}%`],
  };
}

function normalizeHostelLabel(raw) {
  if (raw == null || String(raw).trim() === '') return 'Not specified';
  const v = String(raw).trim().toLowerCase();
  if (v === 'yes' || v === 'y' || v === '1') return 'Yes';
  if (v === 'no' || v === 'n' || v === '0') return 'No';
  return String(raw).trim();
}

function getDefaultApplicationFee() {
  const n = Number(process.env.DEFAULT_APPLICATION_FEE || process.env.APPLICATION_FEE || 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

async function getStudentMasterColumns() {
  if (studentMasterColumnsCache) return studentMasterColumnsCache;
  const [rows] = await db.query('SHOW COLUMNS FROM student_master');
  studentMasterColumnsCache = new Set(rows.map((r) => r.Field));
  return studentMasterColumnsCache;
}

async function resolveCollectionConfig() {
  const cols = await getStudentMasterColumns();
  const amountColumn = CANDIDATE_AMOUNT_COLUMNS.find((c) => cols.has(c)) || null;
  const statusColumn = CANDIDATE_PAYMENT_STATUS_COLUMNS.find((c) => cols.has(c)) || null;
  const defaultFee = getDefaultApplicationFee();
  return { amountColumn, statusColumn, defaultFee };
}

async function applyPaymentWhereClause(where, params, filters) {
  if (!filters.paidOnly) return { where, params };
  const cfg = await resolveCollectionConfig();
  if (cfg.statusColumn) {
    const successStates = SUCCESS_PAYMENT_STATES.map((s) => `'${s}'`).join(', ');
    return {
      where: `${where} AND LOWER(COALESCE(${cfg.statusColumn}, '')) IN (${successStates})`,
      params,
    };
  }
  if (cfg.amountColumn) {
    return {
      where: `${where} AND COALESCE(${cfg.amountColumn}, 0) > 0`,
      params,
    };
  }
  return { where, params };
}

function amountExprFromConfig(cfg) {
  if (!cfg.amountColumn) return null;
  if (!cfg.statusColumn) return `COALESCE(${cfg.amountColumn}, 0)`;
  const successStates = SUCCESS_PAYMENT_STATES.map((s) => `'${s}'`).join(', ');
  return `CASE WHEN LOWER(COALESCE(${cfg.statusColumn}, '')) IN (${successStates}) THEN COALESCE(${cfg.amountColumn}, 0) ELSE 0 END`;
}

async function getCollegeWiseRows(where, params) {
  const [students] = await db.query(`SELECT college_choices FROM student_master WHERE ${where}`, params);
  const codeCount = new Map();
  for (const row of students) {
    if (!row.college_choices) continue;
    let arr;
    try {
      arr = JSON.parse(row.college_choices);
    } catch {
      continue;
    }
    if (!Array.isArray(arr)) continue;
    const seen = new Set();
    for (const code of arr) {
      if (!code || typeof code !== 'string') continue;
      const c = code.trim();
      if (!c || seen.has(c)) continue;
      seen.add(c);
      codeCount.set(c, (codeCount.get(c) || 0) + 1);
    }
  }
  const codes = [...codeCount.keys()];
  if (codes.length === 0) return { rows: [], note: null };

  const [insts] = await db.query('SELECT ins_code, ins_name, ins_district FROM institution_master WHERE ins_code IN (?)', [codes]);
  const meta = new Map(insts.map((i) => [i.ins_code, i]));
  const rows = [...codeCount.entries()]
    .map(([code, count]) => {
      const inst = meta.get(code);
      const label = inst ? `${inst.ins_name} (${code})` : code;
      return { label, count, code };
    })
    .sort((a, b) => b.count - a.count);

  return {
    rows: rows.map(({ label, count }) => ({ label, count })),
    note: 'Each student is counted once per institution they included in their preference list.',
  };
}

async function getCollegeWiseCollectionRows(where, params) {
  const cfg = await resolveCollectionConfig();
  const amountExpr = amountExprFromConfig(cfg);
  const selectAmount = amountExpr ? `${amountExpr} AS collectedAmount` : `${cfg.defaultFee} AS collectedAmount`;
  const [students] = await db.query(`SELECT college_choices, ${selectAmount} FROM student_master WHERE ${where}`, params);
  const codeAmount = new Map();
  for (const row of students) {
    if (!row.college_choices) continue;
    let arr;
    try {
      arr = JSON.parse(row.college_choices);
    } catch {
      continue;
    }
    if (!Array.isArray(arr)) continue;
    const seen = new Set();
    const amount = Number(row.collectedAmount || 0);
    for (const code of arr) {
      if (!code || typeof code !== 'string') continue;
      const c = code.trim();
      if (!c || seen.has(c)) continue;
      seen.add(c);
      codeAmount.set(c, (codeAmount.get(c) || 0) + amount);
    }
  }
  const codes = [...codeAmount.keys()];
  if (codes.length === 0) {
    return {
      rows: [],
      note: cfg.amountColumn
        ? 'Collection is based on paid application amount.'
        : 'Collection is estimated from default application fee. Set DEFAULT_APPLICATION_FEE in server env.',
    };
  }

  const [insts] = await db.query('SELECT ins_code, ins_name, ins_district FROM institution_master WHERE ins_code IN (?)', [codes]);
  const meta = new Map(insts.map((i) => [i.ins_code, i]));
  const rows = [...codeAmount.entries()]
    .map(([code, count]) => {
      const inst = meta.get(code);
      const label = inst ? `${inst.ins_name} (${code})` : code;
      return { label, count, code };
    })
    .sort((a, b) => b.count - a.count);

  return {
    rows: rows.map(({ label, count }) => ({ label, count })),
    note: cfg.amountColumn
      ? 'College ranking is based on total paid application amount by applicants who included the institution.'
      : 'Collection is estimated from default application fee. Set DEFAULT_APPLICATION_FEE in server env.',
  };
}

async function runDateDetailReport(where, params) {
  const [dbRows] = await db.query(
    `SELECT DATE(created_at) AS regDate,
            application_no AS applicationNo,
            COALESCE(NULLIF(TRIM(student_name), ''), '—') AS studentName,
            COALESCE(
              NULLIF(TRIM(mobile), ''),
              NULLIF(TRIM(alt_mobile), ''),
              '—'
            ) AS contact
     FROM student_master
     WHERE ${where}
     ORDER BY created_at ASC, id ASC`,
    params
  );
  const rows = dbRows.map((r) => {
    const d = r.regDate;
    const label = d instanceof Date ? d.toISOString().slice(0, 10) : String(d ?? '—').slice(0, 10);
    const app = r.applicationNo != null && String(r.applicationNo).trim() !== '' ? String(r.applicationNo).trim() : '—';
    const contact =
      r.contact != null && String(r.contact).trim() !== '' ? String(r.contact).trim() : '—';
    return {
      label,
      count: 1,
      applicationNo: app,
      studentName: r.studentName || '—',
      contact,
    };
  });
  return {
    rows,
    note: 'Each row is one student record. Date is the registration date.',
  };
}

async function runGroupedReport(type, where, params) {
  let groupExpr;
  switch (type) {
    case 'gender':
      groupExpr = "COALESCE(NULLIF(TRIM(gender), ''), 'Not specified')";
      break;
    case 'community':
      groupExpr = "COALESCE(NULLIF(TRIM(community), ''), 'Not specified')";
      break;
    case 'district':
      groupExpr = "COALESCE(NULLIF(TRIM(last_institution_district), ''), 'Not specified')";
      break;
    case 'hostel':
      groupExpr = 'hostel_choice';
      break;
    default:
      throw new Error('Invalid type');
  }

  if (type === 'hostel') {
    const [rawRows] = await db.query(
      `SELECT hostel_choice, COUNT(*) as cnt FROM student_master WHERE ${where} GROUP BY hostel_choice`,
      params
    );
    const map = new Map();
    for (const r of rawRows) {
      const label = normalizeHostelLabel(r.hostel_choice);
      map.set(label, (map.get(label) || 0) + Number(r.cnt));
    }
    return {
      rows: [...map.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
      note: null,
    };
  }

  const [rows] = await db.query(
    `SELECT ${groupExpr} AS label, COUNT(*) AS count FROM student_master WHERE ${where} GROUP BY ${groupExpr} ORDER BY label ASC`,
    params
  );
  const out = rows.map((r) => ({
    label: r.label instanceof Date ? r.label.toISOString().slice(0, 10) : String(r.label ?? '—'),
    count: Number(r.count),
  }));
  return { rows: out, note: null };
}

async function runDateCollectionDetailReport(where, params) {
  const cfg = await resolveCollectionConfig();
  const amountExpr = amountExprFromConfig(cfg);
  const selectAmount = amountExpr ? `${amountExpr} AS collectedAmount` : `${cfg.defaultFee} AS collectedAmount`;

  const [dbRows] = await db.query(
    `SELECT DATE(created_at) AS regDate,
            ${selectAmount},
            application_no AS applicationNo,
            COALESCE(NULLIF(TRIM(student_name), ''), '—') AS studentName,
            COALESCE(
              NULLIF(TRIM(mobile), ''),
              NULLIF(TRIM(alt_mobile), ''),
              '—'
            ) AS contact
     FROM student_master
     WHERE ${where}
     ORDER BY created_at ASC, id ASC`,
    params
  );

  const rows = dbRows.map((r) => {
    const d = r.regDate;
    const label = d instanceof Date ? d.toISOString().slice(0, 10) : String(d ?? '—').slice(0, 10);
    const app = r.applicationNo != null && String(r.applicationNo).trim() !== '' ? String(r.applicationNo).trim() : '—';
    const contact =
      r.contact != null && String(r.contact).trim() !== '' ? String(r.contact).trim() : '—';
    return {
      label,
      count: Number(r.collectedAmount || 0),
      applicationNo: app,
      studentName: r.studentName || '—',
      contact,
    };
  });

  return {
    rows,
    note: cfg.amountColumn
      ? 'Each row is one student. Collection uses paid amount when payment status is successful.'
      : 'Collection per student uses the default application fee. Set DEFAULT_APPLICATION_FEE in server env.',
  };
}

/**
 * @param {string} type - report type
 * @param {object} filters - from parseFilters
 * @param {string|null} insCodeFilter - institution code to scope applications (college portal)
 */
async function fetchReportData(type, filters, insCodeFilter = null) {
  let { where, params } = buildWhereClause(filters);
  ({ where, params } = applyCollegeScope(insCodeFilter, where, params));
  ({ where, params } = await applyPaymentWhereClause(where, params, filters));

  if (type === 'college') {
    return getCollegeWiseRows(where, params);
  }
  if (type === 'college_collection') {
    return getCollegeWiseCollectionRows(where, params);
  }
  if (type === 'date_collection') {
    return runDateCollectionDetailReport(where, params);
  }
  if (type === 'date') {
    return runDateDetailReport(where, params);
  }
  return runGroupedReport(type, where, params);
}

function buildReportXlsxBuffer(rows, type, filters, note, fileSlug, scopeLabel = null) {
  const typeLabel = TYPE_LABELS[type] || type;
  let sheetRows;
  if (type === 'date') {
    sheetRows = rows.map((r, idx) => ({
      'Sl.No': idx + 1,
      Date: r.label,
      'Application Number': r.applicationNo ?? '—',
      'Student Name': r.studentName ?? '—',
      'Contact Number': r.contact ?? '—',
    }));
  } else if (type === 'date_collection') {
    sheetRows = rows.map((r, idx) => ({
      'Sl.No': idx + 1,
      Date: r.label,
      'Application Number': r.applicationNo ?? '—',
      'Student Name': r.studentName ?? '—',
      'Contact Number': r.contact ?? '—',
      'Collection Amount': Number(r.count ?? 0),
    }));
  } else {
    const dimCol = typeLabel;
    const valueCol = type === 'college_collection' ? 'Collection Amount' : 'Count';
    sheetRows = rows.map((r) => ({ [dimCol]: r.label, [valueCol]: r.count }));
  }
  const ws = XLSX.utils.json_to_sheet(sheetRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');

  const meta = [
    { Field: 'Report type', Value: typeLabel },
    { Field: 'Generated at', Value: new Date().toISOString() },
    { Field: 'Submitted only', Value: filters.submittedOnly ? 'Yes' : 'No' },
  ];
  if (filters.dateFrom) meta.push({ Field: 'Date from', Value: filters.dateFrom });
  if (filters.dateTo) meta.push({ Field: 'Date to', Value: filters.dateTo });
  if (scopeLabel) meta.push({ Field: 'Scope', Value: scopeLabel });
  if (note) meta.push({ Field: 'Note', Value: note });
  const wsMeta = XLSX.utils.json_to_sheet(meta);
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Filters');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const fname = `${fileSlug}-${type}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return { buffer: buf, filename: fname };
}

module.exports = {
  parseFilters,
  fetchReportData,
  buildReportXlsxBuffer,
  TYPE_LABELS,
  REPORT_TYPES_ADMIN,
  REPORT_TYPES_COLLEGE,
};
