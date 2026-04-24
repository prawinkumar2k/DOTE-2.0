import React, { useEffect, useMemo, useState, useCallback } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import SearchableSelect from '../../components/Common/SearchableSelect';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import { getActionColumn, getDateColumn } from '../../utils/tableHelpers';

function parseCollegeChoiceCodes(collegeChoices) {
  if (collegeChoices == null || collegeChoices === '') return [];
  try {
    const raw = typeof collegeChoices === 'string' ? JSON.parse(collegeChoices) : collegeChoices;
    if (!Array.isArray(raw)) return [];
    return raw.map((c) => String(c).trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function applicationListsInstitution(collegeChoices, insCode) {
  if (!insCode) return true;
  const codes = parseCollegeChoiceCodes(collegeChoices);
  return codes.includes(String(insCode).trim());
}

const StudentApplications = () => {
  const [applications, setApplications] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genderFilter, setGenderFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [appsRes, masterRes, collegesRes] = await Promise.all([
        axios.get('/api/admin/student-applications', { withCredentials: true }),
        axios.get('/api/admin/master-data', { withCredentials: true }).catch(() => ({ data: {} })),
        axios.get('/api/admin/colleges', { withCredentials: true }).catch(() => ({ data: {} })),
      ]);

      if (appsRes.data.success) {
        setApplications(appsRes.data.applications || []);
      }
      if (masterRes.data?.success && Array.isArray(masterRes.data.districts)) {
        setDistricts(masterRes.data.districts);
      }
      if (collegesRes.data?.success && Array.isArray(collegesRes.data.colleges)) {
        setColleges(collegesRes.data.colleges);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load student applications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const districtOptions = useMemo(() => [
    { value: '', label: 'All districts' },
    ...[...new Set(districts.map(d => (d.district_name || '').trim()).filter(Boolean))].sort().map(name => ({ value: name, label: name }))
  ], [districts]);

  const institutionOptions = useMemo(() => [
    { value: '', label: 'All institutions' },
    ...[...colleges].sort((a, b) => (a.ins_name || '').localeCompare(b.ins_name || '')).filter(c => c.ins_code).map(c => ({
      value: String(c.ins_code).trim(),
      label: `${c.ins_name || '—'} (${c.ins_code})`,
    }))
  ], [colleges]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const appGender = (app.gender || '').toLowerCase();
      const matchesGender = genderFilter === 'All' || appGender === genderFilter.toLowerCase();

      let matchesDate = true;
      if (app.created_at) {
        const appDate = new Date(app.created_at);
        if (dateFrom) {
          const from = new Date(`${dateFrom}T00:00:00`);
          if (appDate < from) matchesDate = false;
        }
        if (dateTo) {
          const to = new Date(`${dateTo}T23:59:59`);
          if (appDate > to) matchesDate = false;
        }
      } else if (dateFrom || dateTo) {
        matchesDate = false;
      }

      const d = (app.last_institution_district || '').trim().toLowerCase();
      const matchesDistrict = !districtFilter || d === districtFilter.trim().toLowerCase();
      const matchesInstitution = !institutionFilter || applicationListsInstitution(app.college_choices, institutionFilter);

      return matchesGender && matchesDate && matchesDistrict && matchesInstitution;
    });
  }, [applications, genderFilter, dateFrom, dateTo, districtFilter, institutionFilter]);

  const columns = useMemo(() => [
    {
      header: "Student Name",
      accessor: "student_name",
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div>
          <p className="font-bold text-slate-800">{value || 'N/A'}</p>
          <p className="text-[10px] text-slate-500">{row.gender || '—'} • {row.community || '—'}</p>
          {row.last_institution_district && (
             <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-tighter font-bold">Dist: {row.last_institution_district}</p>
          )}
        </div>
      )
    },
    {
      header: "Application No",
      accessor: "application_no",
      sortable: true,
      filterable: true,
      render: (value) => <span className="font-semibold text-blue-600">{value || 'N/A'}</span>
    },
    {
      header: "Contact",
      accessor: "email",
      filterable: true,
      render: (value, row) => (
        <div>
          <p className="text-xs text-slate-700">{value || '—'}</p>
          <p className="text-[10px] text-slate-500">{row.mobile || '—'}</p>
        </div>
      )
    },
    getDateColumn("Submitted", "created_at"),
    {
      header: "Download",
      accessor: "id",
      render: (_, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/admin/student-applications/${row.id}/report`); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 transition-all active:scale-95"
        >
          <Download size={12} />
          Report
        </button>
      )
    }
  ], [navigate]);

  return (
    <MainLayout role="admin">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Student Applications</h1>
            <p className="text-slate-500">Manage and view all incoming student applications</p>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender:</label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="bg-slate-50 border border-slate-100 py-2 px-3 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all text-slate-700"
              >
                <option value="All">All Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">District:</label>
              <SearchableSelect
                value={districtFilter}
                onChange={setDistrictFilter}
                options={districtOptions}
                className="w-40"
                disabled={loading}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">College:</label>
              <SearchableSelect
                value={institutionFilter}
                onChange={setInstitutionFilter}
                options={institutionOptions}
                className="w-56"
                disabled={loading}
              />
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date:</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-slate-50 border border-slate-100 py-2 px-3 rounded-xl text-xs font-bold focus:outline-none text-slate-700"
                  title="From date"
                />
                <span className="text-slate-300">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-slate-50 border border-slate-100 py-2 px-3 rounded-xl text-xs font-bold focus:outline-none text-slate-700"
                  title="To date"
                />
              </div>
            </div>
        </div>

        <DataTable
          rowKey="id"
          columns={columns}
          data={filteredApplications}
          isLoading={loading}
          emptyMessage="No applications found matching the selected filters."
        />
      </div>
    </MainLayout>
  );
};

export default StudentApplications;
