import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import MainLayout from '../../components/layout/MainLayout';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils';
import DataTable from '../../components/DataTable';
import { getActionColumn, getDateColumn } from '../../utils/tableHelpers';

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
  const [genderFilter, setGenderFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const { data } = await axios.get('/api/college/applications', { withCredentials: true });
        if (data.success && data.applications) {
          const formattedApps = data.applications.map(app => ({
            ...app,
            db_id: app.id,
            id: app.application_no || `APP-${app.id}`,
            name: app.student_name || 'Anonymous',
            displayDate: formatDate(app.created_at),
            gender: app.gender || '—',
            community: app.community || '—',
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

  // External filters (Gender & Date)
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const appGender = (app.gender || '').toLowerCase();
      const matchesGender =
        genderFilter === 'All' ||
        appGender === genderFilter.toLowerCase();

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

      return matchesGender && matchesDate;
    });
  }, [apps, genderFilter, dateFrom, dateTo]);

  const columns = useMemo(() => [
    {
      header: "Student Name",
      accessor: "name",
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
            {value?.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="font-bold text-slate-800">{value}</p>
            <p className="text-[10px] text-slate-500">{row.gender} • {row.community}</p>
          </div>
        </div>
      )
    },
    {
      header: "Application No",
      accessor: "id",
      sortable: true,
      filterable: true,
      render: (value) => <span className="font-semibold text-blue-600">{value}</span>
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
      header: "Documents",
      accessor: "documents",
      render: (_, row) => (
        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
          <DocumentLink path={row.photo} label="Photo" />
          <DocumentLink path={row.transfer_certificate} label="TC" />
          <DocumentLink path={row.marksheet_certificate} label="Marks" />
          <DocumentLink path={row.community_certificate} label="Comm" />
          <DocumentLink path={row.experience_certificate || row.experinece_certificate} label="Exp" />
        </div>
      )
    },
    getActionColumn({
      onView: (row) => navigate(`/college/applications/${row.db_id}`)
    })
  ], [navigate]);

  return (
    <MainLayout role="college">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Incoming Applications</h1>
            <p className="text-slate-500">{apps.length} submitted application{apps.length !== 1 ? 's' : ''} total</p>
          </div>
        </div>

        {/* Custom Filters */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender:</label>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="bg-slate-50 border border-slate-100 py-2 px-3 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all text-slate-700"
            >
              <option value="All">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Range:</label>
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

        <DataTable
          rowKey="id"
          columns={columns}
          data={filteredApps}
          isLoading={loading}
          emptyMessage="No applications match your criteria."
        />
      </div>
    </MainLayout>
  );
};

export default ApplicationsList;
