import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import MainLayout from '../../components/layout/MainLayout';
import { Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const normalizeFileUrl = (filePath) => {
  if (!filePath) return '';
  if (/^https?:\/\//i.test(filePath)) return filePath;
  return filePath.startsWith('/') ? filePath : `/${filePath}`;
};

const DocumentLink = ({ path, label }) => {
  const href = normalizeFileUrl(path);
  if (!href) {
    return (
      <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-400 text-[11px] font-semibold cursor-not-allowed">
        {label}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      download
      className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-100 hover:bg-emerald-100 transition-colors"
      title={`Download ${label}`}
    >
      {label}
    </a>
  );
};

const ApplicationsList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const PAGE_SIZE = 20;

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const { data } = await axios.get('/api/college/applications', { withCredentials: true });
        if (data.success && data.applications) {
          const formattedApps = data.applications.map(app => ({
            db_id: app.id,
            id: app.application_no || `APP-${app.id}`,
            name: app.student_name || 'Anonymous',
            date: app.created_at ? new Date(app.created_at).toISOString().split('T')[0] : '2026-04-10',
            gender: app.gender || '—',
            community: app.community || '—',
            email: app.email,
            mobile: app.mobile,
            raw: app
          }));
          setApps(formattedApps);
        }
      } catch (err) {
        console.error('Failed to load applications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  const filteredApps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return apps.filter((app) => {
      const matchesSearch = !q ||
        (app.name || '').toLowerCase().includes(q) ||
        (app.id || '').toLowerCase().includes(q) ||
        (app.email || '').toLowerCase().includes(q);

      const appGender = (app.gender || '').toLowerCase();
      const matchesGender =
        genderFilter === 'All' ||
        appGender === genderFilter.toLowerCase();

      let matchesDate = true;
      if (app.raw?.created_at) {
        const appDate = new Date(app.raw.created_at);
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

      return matchesSearch && matchesGender && matchesDate;
    });
  }, [apps, searchQuery, genderFilter, dateFrom, dateTo]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, genderFilter, dateFrom, dateTo]);

  const total = filteredApps.length;
  const paginated = filteredApps.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <MainLayout role="college">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Incoming Applications</h1>
            <p className="text-slate-500">{apps.length} submitted application{apps.length !== 1 ? 's' : ''} total</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by student name, application no, email..."
                className="w-full bg-slate-50 border border-slate-200 py-3 pl-12 pr-4 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 py-3 px-3 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-700"
            >
              <option value="All">All Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 py-3 px-3 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-700"
              title="From date"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 py-3 px-3 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-700"
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
                  <th className="px-4 py-4">Documents</th>
                  <th className="px-4 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">Loading student applications...</td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">No applications match your criteria.</td>
                  </tr>
                ) : paginated.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {app.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{app.name}</p>
                          <p className="text-xs text-slate-500">{app.gender} • {app.community}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-blue-600">{app.id}</td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-slate-700">{app.email || '—'}</p>
                      <p className="text-xs text-slate-500">{app.mobile || '—'}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {app.raw?.created_at ? new Date(app.raw.created_at).toLocaleDateString() : (app.date || '—')}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2 max-w-[240px]">
                        <DocumentLink path={app.raw?.photo} label="Photo" />
                        <DocumentLink path={app.raw?.transfer_certificate} label="TC" />
                        <DocumentLink path={app.raw?.marksheet_certificate} label="Marksheet" />
                        <DocumentLink path={app.raw?.community_certificate} label="Community" />
                       
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => navigate(`/college/applications/${app.db_id}`)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100"
                      >
                        <Eye size={14} />
                        Application
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > PAGE_SIZE && (
            <div className="mt-6 flex justify-between items-center">
              <p className="text-xs text-slate-500">Showing {paginated.length} of {total}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 disabled:opacity-40">Prev</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page * PAGE_SIZE >= total}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ApplicationsList;
