const {
  parseFilters,
  fetchReportData,
  buildReportXlsxBuffer,
  TYPE_LABELS,
  REPORT_TYPES_ADMIN,
} = require('../services/reports.service');

const getApplicationReports = async (req, res) => {
  try {
    const type = (req.query.type || 'gender').toLowerCase();
    if (!REPORT_TYPES_ADMIN.includes(type)) {
      return res.status(400).json({ message: `Invalid report type. Use one of: ${REPORT_TYPES_ADMIN.join(', ')}` });
    }
    const filters = parseFilters(req.query);
    const { rows, note } = await fetchReportData(type, filters, null);
    const totalCount = rows.reduce((s, r) => s + r.count, 0);

    res.json({
      success: true,
      type,
      title: TYPE_LABELS[type] || type,
      rows,
      totalCount,
      note: note || undefined,
      filters,
    });
  } catch (err) {
    console.error('Admin report error:', err);
    res.status(500).json({ message: err.message || 'Failed to build report' });
  }
};

const exportApplicationReport = async (req, res) => {
  try {
    const type = (req.query.type || 'gender').toLowerCase();
    if (!REPORT_TYPES_ADMIN.includes(type)) {
      return res.status(400).json({ message: `Invalid report type. Use one of: ${REPORT_TYPES_ADMIN.join(', ')}` });
    }
    const filters = parseFilters(req.query);
    const { rows, note } = await fetchReportData(type, filters, null);
    const { buffer, filename } = buildReportXlsxBuffer(rows, type, filters, note, 'dote-applications');

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Admin report export error:', err);
    res.status(500).json({ message: err.message || 'Failed to export report' });
  }
};

module.exports = {
  getApplicationReports,
  exportApplicationReport,
  REPORT_TYPES: REPORT_TYPES_ADMIN,
};
