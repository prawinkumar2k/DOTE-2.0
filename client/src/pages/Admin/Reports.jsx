import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import ReportChartBlock from '../../components/reports/ReportChartBlock';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FileSpreadsheet, FileText, Filter, RefreshCw, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const REPORT_TABS = [
  { id: 'date', label: 'Date wise' },
  { id: 'gender', label: 'Gender wise' },
  { id: 'community', label: 'Community wise' },
  { id: 'admission_type', label: 'Admission Type' },
  { id: 'college', label: 'College wise' },
  { id: 'district', label: 'District wise' },
  { id: 'hostel', label: 'Hostel wise' },
  { id: 'date_collection', label: 'Date wise collection' },
  { id: 'college_collection', label: 'College wise collection' },
];

const REPORT_HEADING_MAP = {
  date: 'DATEWISE APPLICATION REPORT',
  gender: 'GENDERWISE APPLICATION REPORT',
  community: 'COMMUNITYWISE APPLICATION REPORT',
  admission_type: 'ADMISSION TYPE APPLICATION REPORT',
  college: 'COLLEGEWISE APPLICATION REPORT',
  college_collection: 'COLLEGEWISE COLLECTION REPORT',
  district: 'DISTRICTWISE APPLICATION REPORT',
  hostel: 'HOSTELWISE APPLICATION REPORT',
  date_collection: 'DATEWISE COLLECTION REPORT',
};

const REPORT_LABEL_MAP = {
  date: 'Date wise',
  gender: 'Gender wise',
  community: 'Community wise',
  admission_type: 'Admission type',
  college: 'College wise',
  college_collection: 'College wise collection',
  district: 'District wise',
  hostel: 'Hostel wise',
  date_collection: 'Date wise collection',
};

const Reports = () => {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState('date');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [submittedOnly, setSubmittedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);

  const queryParams = useCallback(() => {
    const p = new URLSearchParams();
    p.set('type', reportType);
    if (dateFrom) p.set('dateFrom', dateFrom);
    if (dateTo) p.set('dateTo', dateTo);
    if (submittedOnly) p.set('submittedOnly', 'true');
    return p.toString();
  }, [reportType, dateFrom, dateTo, submittedOnly]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/admin/reports?${queryParams()}`, { withCredentials: true });
      if (res.data.success) setPayload(res.data);
      else setPayload(null);
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Could not load report');
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = async () => {
    try {
      const res = await axios.get(`/api/admin/reports/export?${queryParams()}`, {
        withCredentials: true,
        responseType: 'blob',
      });
      const dispo = res.headers['content-disposition'];
      let filename = `report-${reportType}.xlsx`;
      if (dispo && dispo.includes('filename=')) {
        const m = dispo.match(/filename="?([^";]+)"?/);
        if (m) filename = m[1];
      }
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', filename);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Excel file downloaded');
    } catch (e) {
      if (e.response?.data instanceof Blob) {
        const text = await e.response.data.text();
        try {
          const j = JSON.parse(text);
          toast.error(j.message || 'Export failed');
        } catch {
          toast.error('Export failed');
        }
      } else {
        toast.error(e.response?.data?.message || 'Export failed');
      }
    }
  };

  const handlePdfExport = () => {
    if (!rows.length) return;
    navigate('/admin/reports/preview', {
      state: {
        fileName: `report-${reportType}.pdf`,
        reportData: {
          reportType,
          heading: REPORT_HEADING_MAP[reportType] || 'APPLICATION REPORT',
          tableTitle: payload?.title || 'Category',
          rows,
          collegeCode: payload?.collegeCode || payload?.meta?.collegeCode || '—',
          shortNote: reportShortNote,
        },
      },
    });
  };

  const rows = payload?.rows || [];
  const isDateWiseList = reportType === 'date';
  const isDateCollectionList = reportType === 'date_collection';
  const isStudentDetailTable = isDateWiseList || isDateCollectionList;
  const isCollectionReport = reportType === 'date_collection' || reportType === 'college_collection';
  const isCollegeCollection = reportType === 'college_collection';
  const formatCollection = (value) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  const headerTotalLabel = isDateWiseList ? 'Total records' : isCollectionReport ? 'Total collection' : 'Total count';
  const headerTotalValue = isDateWiseList
    ? payload?.totalCount ?? '—'
    : isCollectionReport
      ? formatCollection(payload?.totalCount ?? 0)
      : payload?.totalCount ?? '—';
  const reportShortNote = `Report: ${REPORT_LABEL_MAP[reportType] || reportType}. Date range: ${dateFrom || 'All'
    } to ${dateTo || 'All'}. Submitted only: ${submittedOnly ? 'Yes' : 'No'}. Total ${isDateWiseList ? 'records' : isCollectionReport ? 'collection' : 'count'
    }: ${isDateWiseList ? payload?.totalCount ?? 0 : isCollectionReport ? formatCollection(payload?.totalCount ?? 0) : payload?.totalCount ?? 0}.`;

  return (
    <MainLayout role="admin">
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <BarChart3 size={20} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Analytics</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Application reports</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium max-w-2xl">
              Directorate-wide summaries: each report type uses a dedicated chart. Export matches the table data.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={loading || !rows.length}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              <FileSpreadsheet size={16} />
              Download Excel
            </button>
            <button
              type="button"
              onClick={handlePdfExport}
              disabled={loading || !rows.length}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-sm hover:bg-slate-800 disabled:opacity-50"
            >
              <FileText size={16} />
              Download PDF
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80">
          {REPORT_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setReportType(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${reportType === t.id
                ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-4">
            <Filter size={16} className="text-slate-400" />
            Filters
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">From date</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">To date</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              />
            </label>
            <label className="flex items-center gap-3 sm:col-span-2 lg:col-span-2 rounded-xl border border-slate-200 px-4 py-3 cursor-pointer hover:bg-slate-50/80">
              <input
                type="checkbox"
                checked={submittedOnly}
                onChange={(e) => setSubmittedOnly(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-slate-700">Only students with an application number (submitted)</span>
            </label>
          </div>
        </div>

        {payload?.note && (
          <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 font-medium">
            {payload.note}
          </div>
        )}


        <div className="grid xl:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[320px]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">{payload?.title || 'Report'}</h2>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {headerTotalLabel}: {headerTotalValue}
              </span>
            </div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400 text-sm font-semibold">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                Loading…
              </div>
            ) : rows.length === 0 ? (
              <p className="p-8 text-center text-slate-500 text-sm font-medium">No records match these filters.</p>
            ) : (
              <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                <table className={`w-full text-sm ${isStudentDetailTable ? 'border border-slate-200' : ''}`}>
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                    <tr>
                      {isStudentDetailTable ? (
                        <>
                          <th className="text-left px-3 py-3 font-bold text-slate-600 uppercase tracking-wider text-[10px] border-r border-slate-200 w-14">
                            Sl.No
                          </th>
                          <th className="text-left px-3 py-3 font-bold text-slate-600 uppercase tracking-wider text-[10px] border-r border-slate-200">
                            Date
                          </th>
                          <th className="text-left px-3 py-3 font-bold text-slate-600 uppercase tracking-wider text-[10px] border-r border-slate-200">
                            Application number
                          </th>
                          <th className="text-left px-3 py-3 font-bold text-slate-600 uppercase tracking-wider text-[10px] border-r border-slate-200">
                            Student name
                          </th>
                          <th className="text-left px-3 py-3 font-bold text-slate-600 uppercase tracking-wider text-[10px] border-r border-slate-200">
                            Contact number
                          </th>
                          {isDateCollectionList && (
                            <th className="text-right px-3 py-3 font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                              Collection
                            </th>
                          )}
                        </>
                      ) : (
                        <>
                          <th className="text-left px-6 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                            {payload?.title || 'Dimension'}
                          </th>
                          {isCollegeCollection && (
                            <th className="text-center px-3 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                              Rank
                            </th>
                          )}
                          <th className="text-right px-6 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                            {isCollectionReport ? 'Collection' : 'Count'}
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {isStudentDetailTable
                      ? rows.map((r, i) => (
                          <tr
                            key={`${r.label}-${r.applicationNo}-${i}`}
                            className="border-b border-slate-100 hover:bg-slate-50/60"
                          >
                            <td className="px-3 py-2.5 text-slate-700 font-semibold tabular-nums border-r border-slate-100">
                              {i + 1}.
                            </td>
                            <td className="px-3 py-2.5 text-slate-800 font-medium whitespace-nowrap border-r border-slate-100">
                              {r.label}
                            </td>
                            <td className="px-3 py-2.5 text-slate-800 font-medium tabular-nums border-r border-slate-100">
                              {r.applicationNo}
                            </td>
                            <td className="px-3 py-2.5 text-slate-800 font-medium border-r border-slate-100">
                              {r.studentName}
                            </td>
                            <td className="px-3 py-2.5 text-slate-800 font-medium tabular-nums border-r border-slate-100">
                              {r.contact}
                            </td>
                            {isDateCollectionList && (
                              <td className="px-3 py-2.5 text-right text-slate-900 font-bold tabular-nums">
                                {formatCollection(r.count)}
                              </td>
                            )}
                          </tr>
                        ))
                      : rows.map((r, i) => (
                          <tr key={`${r.label}-${i}`} className="border-b border-slate-50 hover:bg-slate-50/60">
                            <td className="px-6 py-3 text-slate-800 font-medium max-w-md">{r.label}</td>
                            {isCollegeCollection && (
                              <td className="px-3 py-3 text-center">
                                <span
                                  className={`inline-flex min-w-[28px] h-7 items-center justify-center rounded-full text-[11px] font-extrabold ${i === 0
                                    ? 'bg-amber-100 text-amber-900'
                                    : i === 1
                                      ? 'bg-slate-200 text-slate-900'
                                      : i === 2
                                        ? 'bg-orange-100 text-orange-900'
                                        : 'bg-blue-50 text-blue-800'
                                    }`}
                                >
                                  #{i + 1}
                                </span>
                              </td>
                            )}
                            <td className="px-6 py-3 text-right font-bold text-slate-900 tabular-nums">
                              {isCollectionReport ? formatCollection(r.count) : r.count}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <ReportChartBlock
            variant="admin"
            reportType={reportType}
            rows={rows}
            loading={loading}
            payloadTitle={payload?.title}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default Reports;
