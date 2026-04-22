import React, { useEffect, useMemo, useState, useCallback } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import SearchableSelect from '../../components/Common/SearchableSelect';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Download, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const [searchQuery, setSearchQuery] = useState('');
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

  const sortedDistrictNames = useMemo(() => {
    const names = districts
      .map((d) => (d.district_name || '').trim())
      .filter(Boolean);
    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  }, [districts]);

  const sortedColleges = useMemo(() => {
    return [...colleges].sort((a, b) =>
      String(a.ins_name || '').localeCompare(String(b.ins_name || ''), undefined, { sensitivity: 'base' })
    );
  }, [colleges]);

  const districtOptions = useMemo(
    () => [
      { value: '', label: 'All districts' },
      ...sortedDistrictNames.map((name) => ({ value: name, label: name })),
    ],
    [sortedDistrictNames]
  );

  const institutionOptions = useMemo(
    () => [
      { value: '', label: 'All institutions' },
      ...sortedColleges
        .filter((c) => c.ins_code != null && String(c.ins_code).trim() !== '')
        .map((c) => ({
          value: String(c.ins_code).trim(),
          label: `${c.ins_name || '—'} (${c.ins_code})`,
        })),
    ],
    [sortedColleges]
  );

  const filteredApplications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return applications.filter((app) => {
      const matchesSearch =
        !q ||
        (app.student_name || '').toLowerCase().includes(q) ||
        (app.application_no || '').toLowerCase().includes(q) ||
        (app.email || '').toLowerCase().includes(q);

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
      const matchesDistrict =
        !districtFilter || d === districtFilter.trim().toLowerCase();

      const matchesInstitution =
        !institutionFilter || applicationListsInstitution(app.college_choices, institutionFilter);

      return matchesSearch && matchesGender && matchesDate && matchesDistrict && matchesInstitution;
    });
  }, [
    applications,
    searchQuery,
    genderFilter,
    dateFrom,
    dateTo,
    districtFilter,
    institutionFilter,
  ]);

  const handleDownloadApplication = (app) => {
    navigate(`/admin/student-applications/${app.id}/report`);
  };

  const filterActive =
    searchQuery.trim() ||
    genderFilter !== 'All' ||
    dateFrom ||
    dateTo ||
    districtFilter ||
    institutionFilter;

  return (
    <MainLayout role="admin">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Student Applications</h1>
            <p className="text-slate-500">
              {applications.length} submitted application{applications.length === 1 ? '' : 's'} loaded
              {filterActive && filteredApplications.length !== applications.length && (
                <span className="text-slate-600 font-medium">
                  {' '}
                  · {filteredApplications.length} match current filters
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex flex-nowrap items-center gap-2 sm:gap-2.5 mb-6 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:thin]">
            <div className="relative shrink-0 w-[9.5rem] sm:w-44 md:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, app no, email…"
                title="Search by student name, application number, or email"
                className="w-full bg-slate-50 border border-slate-200 py-2 pl-8 pr-2 rounded-lg text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all placeholder:text-slate-400"
              />
            </div>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="shrink-0 w-[6.75rem] sm:w-28 bg-slate-50 border border-slate-200 py-2 px-2 rounded-lg text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all text-slate-700"
            >
              <option value="All">All Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <SearchableSelect
              value={districtFilter}
              onChange={setDistrictFilter}
              options={districtOptions}
              className="shrink-0 w-[7.5rem] sm:w-32 md:w-36 max-w-[9.5rem]"
              disabled={loading}
            />
            <SearchableSelect
              value={institutionFilter}
              onChange={setInstitutionFilter}
              options={institutionOptions}
              className="shrink-0 w-[8.25rem] sm:w-40 md:w-44 max-w-[11rem] md:max-w-[13rem]"
              disabled={loading}
            />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="shrink-0 w-[9.25rem] sm:w-[9.75rem] bg-slate-50 border border-slate-200 py-2 px-2 rounded-lg text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all text-slate-700"
              title="From date"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="shrink-0 w-[9.25rem] sm:w-[9.75rem] bg-slate-50 border border-slate-200 py-2 px-2 rounded-lg text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all text-slate-700"
              title="To date"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-4 py-4">Student Name</th>
                  <th className="px-4 py-4">Application No</th>
                  <th className="px-4 py-4">Contact</th>
                  <th className="px-4 py-4">Submitted</th>
                  <th className="px-4 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                      Loading student applications...
                    </td>
                  </tr>
                ) : filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                      No applications found.
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-800">{app.student_name || 'N/A'}</p>
                        <p className="text-xs text-slate-500">
                          {app.gender || '—'} • {app.community || '—'}
                        </p>
                        {app.last_institution_district ? (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Last institution district: {app.last_institution_district}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-blue-600">
                        {app.application_no || 'N/A'}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-slate-700">{app.email || '—'}</p>
                        <p className="text-xs text-slate-500">{app.mobile || '—'}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {app.created_at ? new Date(app.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadApplication(app)}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100"
                            title="Download Application"
                          >
                            <Download size={14} />
                            Application
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default StudentApplications;
