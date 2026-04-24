import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import MainLayout from '../../components/layout/MainLayout';
import { FileText, Clock, Download, ArrowUpRight, MapPin, User2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';
import { Link } from 'react-router-dom';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const CollegeDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get('/api/college/dashboard/stats', { withCredentials: true });
        if (response.data.success) {
          setData(response.data);
        }
      } catch (err) {
        console.error('Error fetching college stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);


  const stats = data?.stats || {};
  const timelineData = data?.timelineData || [];
  const genderData = data?.genderBreakdown || [];
  const districtData = data?.districtBreakdown || [];
  const recentApps = data?.recentApplications || [];

  const statCards = useMemo(
    () => [
      {
        label: 'Total Applications',
        value: Number(stats.totalApplications || 0),
        icon: <FileText size={18} />,
        tone: 'blue',
      },
      {
        label: 'Pending Review',
        value: Number(stats.pendingReview || 0),
        icon: <Clock size={18} />,
        tone: 'amber',
      },
    ],
    [stats]
  );

  if (loading) {
    return (
      <MainLayout role="college">
        <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin shadow-lg shadow-blue-50" />
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[11px]">Loading college dashboard...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout role="college">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">College Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">
              Live data for the logged-in college account (applications, trends, demographics, districts).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/college/applications"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <FileText size={16} />
              Applications
            </Link>
            <Link
              to="/college/reports"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-700 text-sm font-semibold border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <Download size={16} />
              Reports
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {statCards.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} icon={item.icon} tone={item.tone} />
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800">Applications Trend (Last 30 Days)</h2>
              <span className="text-xs text-slate-500">{timelineData.length} data points</span>
            </div>
            <div className="h-72 w-full">
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={timelineData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="appTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={formatDate}
                    />
                    <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelFormatter={formatDate}
                    />
                    <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} fill="url(#appTrend)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">No timeline data available.</div>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-4">Gender Distribution</h2>
            <div className="h-56 w-full">
              {genderData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      dataKey="count"
                      nameKey="gender"
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={74}
                      paddingAngle={2}
                    >
                      {genderData.map((_, index) => (
                        <Cell key={`gender-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '0.75rem', border: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">No gender data available.</div>
              )}
            </div>
            <div className="space-y-2 mt-2">
              {genderData.map((item, idx) => (
                <div key={`${item.gender}-${idx}`} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-slate-700 font-semibold truncate">{item.gender}</span>
                  </div>
                  <span className="text-slate-900 font-bold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800">Top Districts (Last Institution)</h2>
            <MapPin size={16} className="text-slate-400" />
          </div>
          <div className="h-80 w-full">
            {districtData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtData} layout="vertical" margin={{ top: 8, right: 20, left: 4, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={120}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#475569' }}
                  />
                  <RechartsTooltip contentStyle={{ borderRadius: '0.75rem', border: 'none' }} />
                  <Bar dataKey="count" fill="#2563eb" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No district data available.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Recent Applications</h2>
              <p className="text-xs text-slate-500">Latest submissions available for this college</p>
            </div>
            <Link to="/college/applications" className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Application No</th>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentApps.length > 0 ? (
                  recentApps.slice(0, 6).map((app, idx) => (
                    <tr key={`${app.id || idx}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                            <User2 size={14} />
                          </div>
                          <span className="text-sm font-semibold text-slate-800">{app.student_name || 'Anonymous'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-blue-700 font-semibold">{app.application_no || `APP-${app.id}`}</td>
                      <td className="px-5 py-3 text-sm text-slate-600">{formatDateTime(app.created_at)}</td>
                      <td className="px-5 py-3">
                        <StatusBadge value={app.application_status || 'Submitted'} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-5 py-8 text-center text-slate-400 text-sm">
                      No recent applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

const toneClassMap = {
  blue: {
    wrap: 'bg-blue-50 text-blue-700',
    border: 'border-blue-100',
  },
  green: {
    wrap: 'bg-emerald-50 text-emerald-700',
    border: 'border-emerald-100',
  },
  amber: {
    wrap: 'bg-amber-50 text-amber-700',
    border: 'border-amber-100',
  },
  red: {
    wrap: 'bg-rose-50 text-rose-700',
    border: 'border-rose-100',
  },
};

const StatCard = ({ icon, label, value, tone }) => {
  const toneClasses = toneClassMap[tone] || toneClassMap.blue;
  return (
    <div className={`bg-white rounded-2xl border ${toneClasses.border} p-4 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{Number(value || 0).toLocaleString()}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${toneClasses.wrap}`}>{icon}</div>
      </div>
    </div>
  );
};

const StatusBadge = ({ value }) => {
  const v = String(value || '').toLowerCase().trim();
  if (v === 'approved') {
    return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">Approved</span>;
  }
  if (v === 'rejected') {
    return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">Rejected</span>;
  }
  /** Pending and other non–decision states are shown as Submitted on the college dashboard. */
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
      Submitted
    </span>
  );
};

export default CollegeDashboard;
