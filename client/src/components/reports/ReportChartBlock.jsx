import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

export const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

function stackKey(label, idx) {
  const base = String(label)
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
  return `s${idx}_${base || 'x'}`;
}

const CHART_TITLE_MAP = {
  date: 'Registrations by Date',
  date_collection: 'Collection by Date',
  gender: 'Gender Distribution',
  community: 'Community Distribution',
  admission_type: 'Admission Type Distribution',
  college: 'Top Institutions by Volume',
  college_collection: 'Top Institutions by Collection',
  district: 'District-wise Distribution',
  hostel: 'Hostel Requirement Analysis',
};

const tooltipStyle = {
  borderRadius: '1rem',
  border: 'none',
  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  fontWeight: 700,
  fontSize: '12px',
  padding: '12px'
};

/**
 * @param {'admin'|'college'} variant — college omits college-wise chart
 */
export default function ReportChartBlock({ reportType, rows, loading, payloadTitle, variant = 'admin' }) {
  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  /** Date-wise / date collection APIs return one row per student; charts aggregate by registration date. */
  const chartInputRows = useMemo(() => {
    if (loading || !rows || rows.length === 0) return [];

    if (reportType === 'date') {
      const map = new Map();
      for (const r of rows) {
        const label = r.label || 'Unknown';
        map.set(label, (map.get(label) || 0) + Number(r.count || 1));
      }
      return [...map.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => {
          // Try date sort if possible
          try {
            const da = new Date(a.label.split('-').reverse().join('-'));
            const db = new Date(b.label.split('-').reverse().join('-'));
            if (!isNaN(da) && !isNaN(db)) return da - db;
          } catch(e) {}
          return String(a.label).localeCompare(String(b.label));
        });
    }
    if (reportType === 'date_collection') {
      const map = new Map();
      for (const r of rows) {
        const label = r.label || 'Unknown';
        map.set(label, (map.get(label) || 0) + Number(r.count || 0));
      }
      return [...map.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => {
          try {
            const da = new Date(a.label.split('-').reverse().join('-'));
            const db = new Date(b.label.split('-').reverse().join('-'));
            if (!isNaN(da) && !isNaN(db)) return da - db;
          } catch(e) {}
          return String(a.label).localeCompare(String(b.label));
        });
    }
    return rows;
  }, [reportType, rows, loading]);

  const chartData = useMemo(
    () =>
      chartInputRows.map((r) => ({
        name: r.label?.length > 20 ? `${r.label.slice(0, 18)}…` : (r.label || '—'),
        fullLabel: r.label || '—',
        count: Number(r.count || 0),
      })),
    [chartInputRows]
  );

  const pieData = useMemo(() => chartInputRows.map((r) => ({ name: r.label || '—', value: Number(r.count || 0) })), [chartInputRows]);

  const hostelStackData = useMemo(() => {
    if (!rows || !rows.length) return { data: [], keys: [] };
    const keys = rows.map((r, i) => stackKey(r.label, i));
    const row = rows.reduce((acc, r, i) => {
      acc[keys[i]] = Number(r.count || 0);
      return acc;
    }, {});
    row.name = 'Hostel requirement';
    return { data: [row], keys };
  }, [rows]);

  const chartHeight = useMemo(() => {
    if (variant === 'admin' && (reportType === 'college' || reportType === 'college_collection') && chartInputRows.length) {
      return Math.min(Math.max(120 + chartInputRows.length * 35, 400), 1200);
    }
    return 450;
  }, [reportType, chartInputRows.length, variant]);

  const chartTitle = CHART_TITLE_MAP[reportType] || 'Statistical Analysis';

  const renderChart = () => {
    if (!chartData || chartData.length === 0) return null;

    const showCollegeChart = variant === 'admin' && (reportType === 'college' || reportType === 'college_collection');

    switch (reportType) {
      case 'date':
        return (
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} dx={-10} />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
              formatter={(v) => [v, 'Applications']}
              labelFormatter={(_, items) => items?.[0]?.payload?.fullLabel || ''}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={4}
              dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 8, strokeWidth: 0 }}
              animationDuration={1500}
            />
          </LineChart>
        );
      case 'date_collection':
        return (
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="collectionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
            <YAxis allowDecimals tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} dx={-10} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v) => [formatCurrency(v), 'Collection']}
              labelFormatter={(_, items) => items?.[0]?.payload?.fullLabel || ''}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#10b981"
              strokeWidth={4}
              fill="url(#collectionGradient)"
              dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 7, strokeWidth: 0 }}
              animationDuration={1500}
            />
          </AreaChart>
        );

      case 'gender':
        return (
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={8}
              animationDuration={1000}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        );

      case 'community':
      case 'admission_type':
        return (
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={0}
              outerRadius={140}
              paddingAngle={2}
              animationDuration={1000}
              label={({ name, percent }) => percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''}
              labelLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#fff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px' }} />
          </PieChart>
        );

      case 'college':
      case 'college_collection':
        if (!showCollegeChart) return null;
        return (
          <BarChart layout="vertical" data={chartData} margin={{ top: 10, right: 40, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={160}
              tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v) => [
                reportType === 'college_collection' ? formatCurrency(v) : v,
                reportType === 'college_collection' ? 'Collection' : 'Students',
              ]}
              labelFormatter={(_, items) => items?.[0]?.payload?.fullLabel || ''}
            />
            <Bar
              dataKey="count"
              fill="#3b82f6"
              radius={[0, 10, 10, 0]}
              barSize={20}
              animationDuration={1500}
            >
              {chartData.map((_, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={
                    reportType === 'college_collection'
                      ? i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#fb923c' : '#3b82f6'
                      : COLORS[i % COLORS.length]
                  }
                />
              ))}
            </Bar>
          </BarChart>
        );

      case 'district':
        return (
          <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
              axisLine={false}
              tickLine={false}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v) => [v, 'Applications']}
              labelFormatter={(_, items) => items?.[0]?.payload?.fullLabel || ''}
            />
            <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={30} animationDuration={1500} />
          </BarChart>
        );

      case 'hostel': {
        const { data, keys } = hostelStackData;
        return (
          <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            {rows.map((r, i) => (
              <Bar
                key={keys[i]}
                dataKey={keys[i]}
                name={r.label}
                stackId="hostel"
                fill={COLORS[i % COLORS.length]}
                radius={i === rows.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                animationDuration={1500}
              />
            ))}
          </BarChart>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 h-full flex flex-col min-h-[500px]">
      <div className="mb-8">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">{chartTitle}</h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{payloadTitle || 'Visualization'}</p>
      </div>

      <div className="flex-1 w-full relative">
        {!loading && chartData.length > 0 ? (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
             <ResponsiveContainer width="100%" height="100%">
               {renderChart()}
             </ResponsiveContainer>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-4">
            {loading ? (
              <>
                <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-sm font-bold uppercase tracking-widest">Generating Chart…</span>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                  <BarChart3 size={32} className="opacity-20" />
                </div>
                <span className="text-sm font-bold">No statistical data to visualize</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

