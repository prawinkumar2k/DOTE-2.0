import React, { useMemo, useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { Users, Building, FileText, ShieldCheck, Activity } from 'lucide-react';
import axios from 'axios';
import { formatDate } from '../../utils/dateUtils';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar } from 'recharts';
import DataTable from '../../components/DataTable';
import { getStatusColumn } from '../../utils/tableHelpers';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#ec4899'];

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/admin/dashboard/stats', { withCredentials: true });
        if (response.data.success) setData(response.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const stats = data?.stats || {};
  const communityData = data?.communityBreakdown || [];
  const timelineData = data?.timelineData || [];
  const insTypes = data?.insTypes || [];
  const statusData = data?.statusBreakdown || [];
  const recentActivity = data?.recentActivity || [];

  const govtAndAidedCount = useMemo(
    () =>
      insTypes
        .filter((item) => {
          const label = String(item?.label || '').toLowerCase();
          return label.includes('government') || label.includes('govt') || label.includes('aided');
        })
        .reduce((sum, item) => sum + Number(item?.count || 0), 0),
    [insTypes]
  );

  const statCards = [
    { label: 'Govt + Aided Institutions', value: govtAndAidedCount, icon: <Building size={18} />, tone: 'blue' },
    { label: 'Registered Students', value: Number(stats.totalStudents || 0), icon: <Users size={18} />, tone: 'green' },
    { label: 'Submitted Applications', value: Number(stats.totalApplications || 0), icon: <FileText size={18} />, tone: 'amber' },
    { label: 'Admin Users', value: Number(stats.totalUsers || 0), icon: <ShieldCheck size={18} />, tone: 'violet' },
  ];

  const recentColumns = [
    {
      header: "Student",
      accessor: "student_name",
      render: (value) => <span className="font-bold text-slate-800">{value || 'Anonymous'}</span>
    },
    {
      header: "Application No",
      accessor: "application_no",
      render: (value) => <span className="font-semibold text-blue-700">{value || 'Draft'}</span>
    },
    getStatusColumn("application_status")
  ];

  if (loading) {
    return (
      <MainLayout role="admin">
        <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-400 font-semibold text-sm">Loading admin dashboard...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">System-wide live summary for admissions and institutions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800">Application Timeline (Last 30 Days)</h2>
              <Activity size={16} className="text-slate-400" />
            </div>
            <div className="h-72">
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="timelineFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tickFormatter={formatDate} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip labelFormatter={formatDate} contentStyle={{ borderRadius: '0.75rem', border: 'none' }} />
                    <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} fill="url(#timelineFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">No timeline data.</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-4">Institution Types</h2>
            <div className="h-72">
              {insTypes.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={insTypes} layout="vertical" margin={{ top: 8, right: 10, left: 2, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis type="category" dataKey="label" width={95} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#334155' }} />
                    <Tooltip contentStyle={{ borderRadius: '0.75rem', border: 'none' }} />
                    <Bar dataKey="count" fill="#2563eb" radius={[0, 6, 6, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">No institution type data.</div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-4">Application Status</h2>
            <div className="space-y-3">
              {statusData.length > 0 ? (
                statusData.map((item) => (
                  <div key={item.status} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-sm text-slate-700">{item.status || 'Unknown'}</span>
                    <span className="text-sm font-bold text-slate-900">{Number(item.count || 0)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No status data.</p>
              )}
            </div>
          </div>

          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-4">Community Distribution</h2>
            <div className="grid md:grid-cols-2 gap-3 items-center">
              <div className="h-56">
                {communityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={communityData} dataKey="count" nameKey="community" cx="50%" cy="46%" innerRadius={46} outerRadius={74} paddingAngle={2}>
                        {communityData.map((_, index) => (
                          <Cell key={`community-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '0.75rem', border: 'none' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">No community data.</div>
                )}
              </div>
              <div className="space-y-2">
                {communityData.slice(0, 6).map((row, index) => (
                  <div key={`${row.community}-${index}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-slate-700 truncate">{row.community}</span>
                    </div>
                    <span className="font-bold text-slate-900">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden p-6">
           <h2 className="font-bold text-slate-800 mb-6 px-2">Recent Activity</h2>
           <DataTable
             rowKey="id"
             data={recentActivity}
             columns={recentColumns}
             showToolbar={false}
             showPagination={false}
             showSelection={false}
             emptyMessage="No recent activity."
           />
        </div>
      </div>
    </MainLayout>
  );
};

const toneMap = {
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  violet: 'bg-violet-50 text-violet-700 border-violet-100',
};

const StatCard = ({ label, value, icon, tone }) => {
  const toneClass = toneMap[tone] || toneMap.blue;
  return (
    <div className={`bg-white border rounded-2xl p-4 shadow-sm ${toneClass.split(' ')[2]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{Number(value || 0).toLocaleString()}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${toneClass.split(' ').slice(0, 2).join(' ')}`}>{icon}</div>
      </div>
    </div>
  );
};

export default AdminDashboard;
