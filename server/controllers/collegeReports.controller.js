const {
  parseFilters,
  fetchReportData,
  buildReportXlsxBuffer,
  TYPE_LABELS,
  REPORT_TYPES_COLLEGE,
} = require('../services/reports.service');

const SCOPE_EXCEL_NOTE = 'Applicants who included this institution in their college choices';

const getCollegeApplicationReports = async (req, res) => {
  try {
    const insCode = req.user.id;
    const type = (req.query.type || 'gender').toLowerCase();
    if (!REPORT_TYPES_COLLEGE.includes(type)) {
      return res.status(400).json({ message: `Invalid report type. Use one of: ${REPORT_TYPES_COLLEGE.join(', ')}` });
    }
    const filters = parseFilters(req.query);
    filters.submittedOnly = true;
    filters.paidOnly = true;
    const { rows, note } = await fetchReportData(type, filters, insCode);
    const totalCount = rows.reduce((s, r) => s + r.count, 0);

    res.json({
      success: true,
      type,
      title: TYPE_LABELS[type] || type,
      rows,
      totalCount,
      note: note || undefined,
      filters,
      scope: 'college',
    });
  } catch (err) {
    console.error('College report error:', err);
    res.status(500).json({ message: err.message || 'Failed to build report' });
  }
};

const exportCollegeApplicationReport = async (req, res) => {
  try {
    const insCode = req.user.id;
    const type = (req.query.type || 'gender').toLowerCase();
    if (!REPORT_TYPES_COLLEGE.includes(type)) {
      return res.status(400).json({ message: `Invalid report type. Use one of: ${REPORT_TYPES_COLLEGE.join(', ')}` });
    }
    const filters = parseFilters(req.query);
    filters.submittedOnly = true;
    filters.paidOnly = true;
    const { rows, note } = await fetchReportData(type, filters, insCode);
    const { buffer, filename } = buildReportXlsxBuffer(rows, type, filters, note || null, 'dote-college', SCOPE_EXCEL_NOTE);

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('College report export error:', err);
    res.status(500).json({ message: err.message || 'Failed to export report' });
  }
};

module.exports = {
  getCollegeApplicationReports,
  exportCollegeApplicationReport,
};
