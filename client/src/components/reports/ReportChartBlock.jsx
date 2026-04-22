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

export const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

function stackKey(label, idx) {
  const base = String(label)
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
  return `s${idx}_${base || 'x'}`;
}

const CHART_TITLE_MAP = {
  date: 'Line chart — registrations by date',
  date_collection: 'Gradient area chart — collection by date',
  gender: 'Donut chart — gender distribution',
  community: 'Pie chart — community distribution',
  college: 'Horizontal bar chart — by institution',
  college_collection: 'Horizontal bar chart + ranking — college collection',
  district: 'Bar chart — district (last institution)',
  hostel: 'Stacked bar chart — hostel requirement',
};

const tooltipStyle = {
  borderRadius: '0.75rem',
  border: 'none',
  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  fontWeight: 700,
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
    if (reportType === 'date') {
      const map = new Map();
      for (const r of rows) {
        map.set(r.label, (map.get(r.label) || 0) + Number(r.count || 1));
      }
      return [...map.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => String(a.label).localeCompare(String(b.label)));
    }
    if (reportType === 'date_collection') {
      const map = new Map();
      for (const r of rows) {
        map.set(r.label, (map.get(r.label) || 0) + Number(r.count || 0));
      }
      return [...map.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => String(a.label).localeCompare(String(b.label)));
    }
    return rows;
  }, [reportType, rows]);

  const chartData = useMemo(
    () =>
      chartInputRows.map((r) => ({
        name: r.label.length > 24 ? `${r.label.slice(0, 22)}…` : r.label,
        fullLabel: r.label,
        count: r.count,
      })),
    [chartInputRows]
  );

  const pieData = useMemo(() => chartInputRows.map((r) => ({ name: r.label, value: r.count })), [chartInputRows]);

  const hostelStackData = useMemo(() => {
    if (!rows.length) return { data: [], keys: [] };
    const keys = rows.map((r, i) => stackKey(r.label, i));
    const row = rows.reduce((acc, r, i) => {
      acc[keys[i]] = r.count;
      return acc;
    }, {});
    row.name = 'Hostel requirement';
    return { data: [row], keys };
  }, [rows]);

  const chartHeight = useMemo(() => {
    if (variant === 'admin' && (reportType === 'college' || reportType === 'college_collection') && chartInputRows.length) {
      return Math.min(Math.max(120 + chartInputRows.length * 30, 360), 960);
    }
    if (reportType === 'gender') return 270;
    if (reportType === 'community') return 330;
    return 380;
  }, [reportType, chartInputRows.length, rows.length, variant]);

  const chartTitle = CHART_TITLE_MAP[reportType] || 'Chart';

  const renderChart = () => {
    if (loading || !rows.length) return null;

    const showCollegeChart = variant === 'admin' && (reportType === 'college' || reportType === 'college_collection');

    switch (reportType) {
      case 'date':
        return (
          <LineChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v) => [v, 'Count']}
              labelFormatter={(_, items) => items?.[0]?.payload?.fullLabel || ''}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              name="Applications"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );
      case 'date_collection':
        return (
          <AreaChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id="collectionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.85} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v) => [formatCurrency(v), 'Collection']}
              labelFormatter={(_, items) => items?.[0]?.payload?.fullLabel || ''}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="count"
              name="Collection"
              stroke="#059669"
              strokeWidth={3}
              fill="url(#collectionGradient)"
              dot={{ r: 3.5, fill: '#059669', stroke: '#fff', strokeWidth: 1.5 }}
              activeDot={{ r: 6 }}
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
              cy="46%"
              innerRadius={52}
              outerRadius={82}
              paddingAngle={2}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelLine={{ stroke: '#94a3b8' }}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#fff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [v, n]} />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        );

      case 'community':
        return (
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={0}
              outerRadius={130}
              paddingAngle={1}
              label={({ name, percent }) => (percent > 0.06 ? `${(percent * 100).toFixed(0)}%` : '')}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#fff" strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [v, n]} />
            <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        );

      case 'college':
      case 'college_collection':
        if (!showCollegeChart) return null;
        return (
          <BarChart layout="vertical" data={chartData} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={148}
              tick={{ fontSize: 9, fill: '#64748b' }}
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
              name={reportType === 'college_collection' ? 'Collection' : 'Students'}
              fill="#3b82f6"
              radius={[0, 6, 6, 0]}
              barSize={18}
            >
              {chartData.map((_, i) => (
                <Cell
                  key={`rank-cell-${i}`}
                  fill={
                    reportType === 'college_collection'
                      ? i === 0
                        ? '#f59e0b'
                        : i === 1
                          ? '#64748b'
                          : i === 2
                            ? '#fb923c'
                            : '#3b82f6'
                      : '#3b82f6'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        );

      case 'district':
        return (
          <BarChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 64 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: '#64748b' }}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={72}
              axisLine={false}
              tickLine={false}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v) => [v, 'Count']}
              labelFormatter={(_, items) => items?.[0]?.payload?.fullLabel || ''}
            />
            <Bar dataKey="count" name="Applications" fill="#6366f1" radius={[6, 6, 0, 0]} />
          </BarChart>
        );

      case 'hostel': {
        const { data, keys } = hostelStackData;
        return (
          <BarChart data={data} margin={{ top: 16, right: 24, left: 8, bottom: 48 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            {rows.map((r, i) => (
              <Bar
                key={keys[i]}
                dataKey={keys[i]}
                name={r.label}
                stackId="hostel"
                fill={COLORS[i % COLORS.length]}
                radius={
                  rows.length === 1
                    ? [6, 6, 6, 6]
                    : i === 0
                      ? [0, 0, 4, 4]
                      : i === rows.length - 1
                        ? [4, 4, 0, 0]
                        : [0, 0, 0, 0]
                }
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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 min-h-[320px] flex flex-col">
      <h2 className="font-bold text-slate-900 mb-1">{chartTitle}</h2>
      <p className="text-xs text-slate-400 mb-4 font-medium">{payloadTitle || '—'}</p>
      {!loading && rows.length > 0 ? (
        <div className="flex-1 w-full" style={{ height: chartHeight, minHeight: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm font-medium min-h-[280px]">
          {loading ? 'Loading chart…' : 'No data for chart'}
        </div>
      )}
    </div>
  );
}
