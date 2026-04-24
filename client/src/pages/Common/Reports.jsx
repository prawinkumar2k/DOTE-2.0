import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import ReportChartBlock from '../../components/reports/ReportChartBlock';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FileSpreadsheet, FileText, Filter, RefreshCw, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/DataTable';

const ALL_REPORT_TABS = [
  { id: 'date', label: 'Date wise' },
  { id: 'gender', label: 'Gender wise' },
  { id: 'community', label: 'Community wise' },
  { id: 'admission_type', label: 'Admission Type' },
  { id: 'college', label: 'College wise', adminOnly: true },
  { id: 'district', label: 'District wise' },
  { id: 'hostel', label: 'Hostel wise' },
  { id: 'date_collection', label: 'Date wise collection' },
  { id: 'college_collection', label: 'College wise collection', adminOnly: true },
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

const Reports = ({ role }) => {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState('date');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [submittedOnly, setSubmittedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);

  const isAdmin = role === 'admin';
  const reportTabs = ALL_REPORT_TABS.filter(t => !t.adminOnly || isAdmin);
  const apiBase = isAdmin ? '/api/admin/reports' : '/api/college/reports';
  const previewPath = isAdmin ? '/admin/reports/preview' : '/college/reports/preview';
  const accentColor = isAdmin ? 'text-blue-600' : 'text-emerald-600';
  const ringColor = isAdmin ? 'focus:ring-blue-100 focus:border-blue-300' : 'focus:ring-emerald-100 focus:border-emerald-300';
  const tabActiveBg = isAdmin ? 'text-blue-600' : 'text-emerald-700';

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
      const res = await axios.get(`${apiBase}?${queryParams()}`, { withCredentials: true });
      if (res.data.success) setPayload(res.data);
      else setPayload(null);
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Could not load report');
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [queryParams, apiBase]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = async () => {
    try {
      const res = await axios.get(`${apiBase}/export?${queryParams()}`, {
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

  const rows = payload?.rows || [];
  const isDateWiseList = reportType === 'date';
  const isDateCollectionList = reportType === 'date_collection';
  const isStudentDetailTable = isDateWiseList || isDateCollectionList;
  const isCollectionReport = reportType === 'date_collection' || reportType === 'college_collection';
  const isCollegeCollection = reportType === 'college_collection';

  const formatCollection = useCallback((value) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(value || 0)), []);

  const handlePdfExport = () => {
    if (!rows.length) return;
    navigate(previewPath, {
      state: {
        fileName: `report-${reportType}.pdf`,
        reportData: {
          reportType,
          heading: REPORT_HEADING_MAP[reportType] || 'APPLICATION REPORT',
          tableTitle: payload?.title || 'Category',
          rows,
          collegeCode: payload?.collegeCode || payload?.meta?.collegeCode || '—',
          shortNote: `Report: ${REPORT_LABEL_MAP[reportType] || reportType}. Total: ${rows.length}`,
        },
      },
    });
  };

  const headerTotalLabel = isDateWiseList ? 'Total records' : isCollectionReport ? 'Total collection' : 'Total count';
  const headerTotalValue = isDateWiseList
    ? payload?.totalCount ?? '—'
    : isCollectionReport
      ? formatCollection(payload?.totalCount ?? 0)
      : payload?.totalCount ?? '—';

  const columns = useMemo(() => {
    if (isStudentDetailTable) {
      const cols = [
        {
          header: "Sl.No",
          accessor: "_sn",
          width: "60px",
          render: (_, __, i) => <span className="text-slate-400 font-mono text-xs">{i + 1}.</span>
        },
        {
          header: "Date",
          accessor: "label",
          sortable: true,
          filterable: true,
          render: (val) => <span className="font-medium text-slate-700">{val}</span>
        },
        {
          header: "Application Number",
          accessor: "applicationNo",
          sortable: true,
          filterable: true,
          render: (val) => <span className="font-bold text-blue-600">{val || '—'}</span>
        },
        {
          header: "Student Name",
          accessor: "studentName",
          sortable: true,
          filterable: true,
          render: (val) => <span className="font-bold text-slate-800">{val || '—'}</span>
        },
        {
          header: "Contact Number",
          accessor: "contact",
          filterable: true,
          render: (val) => <span className="text-xs font-medium text-slate-500">{val || '—'}</span>
        }
      ];
      if (isDateCollectionList) {
        cols.push({
          header: "Collection",
          accessor: "count",
          sortable: true,
          render: (val) => <span className="font-black text-slate-900">{formatCollection(val)}</span>
        });
      }
      return cols;
    } else {
      const cols = [
        {
          header: payload?.title || "Category",
          accessor: "label",
          sortable: true,
          filterable: true,
          render: (val) => <span className="font-bold text-slate-800">{val || '—'}</span>
        }
      ];
      if (isCollegeCollection) {
        cols.push({
          header: "Rank",
          accessor: "_rank",
          width: "80px",
          render: (_, __, i) => {
            const rankStyles = [
              'bg-amber-100 text-amber-900',
              'bg-slate-200 text-slate-900',
              'bg-orange-100 text-orange-900',
            ];
            const style = rankStyles[i] || 'bg-blue-50 text-blue-800';
            return (
              <span className={`inline-flex min-w-[28px] h-7 items-center justify-center rounded-full text-[11px] font-extrabold ${style}`}>
                #{i + 1}
              </span>
            );
          }
        });
      }
      cols.push({
        header: isCollectionReport ? "Collection" : "Count",
        accessor: "count",
        sortable: true,
        render: (val) => <span className="font-black text-slate-900">{isCollectionReport ? formatCollection(val) : val}</span>
      });
      return cols;
    }
  }, [isStudentDetailTable, isDateCollectionList, isCollegeCollection, isCollectionReport, payload, formatCollection]);

  return (
    <MainLayout role={role}>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className={`flex items-center gap-2 ${accentColor} mb-1`}>
              <BarChart3 size={20} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Analytics</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Application reports</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium max-w-2xl">
              {isAdmin ? 'Directorate-wide summaries' : 'Institution-specific summaries'}: each report type uses a dedicated chart. Export matches the table data.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={loading || !rows.length}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-all`}
            >
              <FileSpreadsheet size={16} />
              Download Excel
            </button>
            <button
              type="button"
              onClick={handlePdfExport}
              disabled={loading || !rows.length}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-sm hover:bg-slate-800 disabled:opacity-50 transition-all"
            >
              <FileText size={16} />
              Download PDF
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80">
          {reportTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setReportType(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${reportType === t.id
                ? `bg-white ${tabActiveBg} shadow-sm border border-slate-100`
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-6">
            <Filter size={16} className="text-slate-400" />
            Report Filters
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">From date</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={`w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-4 ${ringColor} transition-all`}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">To date</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={`w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-4 ${ringColor} transition-all`}
              />
            </label>
            <label className="flex items-center gap-4 sm:col-span-2 lg:col-span-2 rounded-[1.5rem] border border-slate-200 px-6 py-4 cursor-pointer hover:bg-slate-50/80 transition-all mt-auto h-[52px]">
              <input
                type="checkbox"
                checked={submittedOnly}
                onChange={(e) => setSubmittedOnly(e.target.checked)}
                className={`w-5 h-5 rounded-lg border-slate-300 ${isAdmin ? 'text-blue-600 focus:ring-blue-500' : 'text-emerald-600 focus:ring-emerald-500'}`}
              />
              <span className="text-sm font-bold text-slate-700">Only students with an application number (submitted)</span>
            </label>
          </div>
        </div>

        <div className={`grid ${isStudentDetailTable ? 'grid-cols-1' : 'xl:grid-cols-2'} gap-8`}>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[480px]">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{payload?.title || 'Report Data'}</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Detailed View</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{headerTotalLabel}</span>
                <span className="text-lg font-black text-slate-900">{headerTotalValue}</span>
              </div>
            </div>
            
            <div className="p-2">
              <DataTable
                rowKey={isStudentDetailTable ? "applicationNo" : "label"}
                columns={columns}
                data={rows}
                isLoading={loading}
                showToolbar={false}
                showSelection={false}
                emptyMessage="No records match these filters."
                className="border-none shadow-none"
              />
            </div>
          </div>

          <div className="min-w-0 flex flex-col">
            <ReportChartBlock
              variant={role}
              reportType={reportType}
              rows={rows}
              loading={loading}
              payloadTitle={payload?.title}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Reports;
