import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const parseItemDate = (item) => {
  if (item.date) {
    if (item.date.includes('/')) {
      const parts = item.date.split('/');
      if (parts.length === 3) {
        const parsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (!isNaN(parsed.getTime())) return parsed;
      }
    }
    const parsed = new Date(item.date);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  if (item.createdAt) {
    const parsed = new Date(item.createdAt);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
};

const QualityTrendChart = ({ data }) => {
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 3m, 6m, 1y

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Calculate cutoff date based on range
    const cutoff = new Date();
    switch (timeRange) {
      case '7d': cutoff.setDate(cutoff.getDate() - 7); break;
      case '30d': cutoff.setDate(cutoff.getDate() - 30); break;
      case '3m': cutoff.setMonth(cutoff.getMonth() - 3); break;
      case '6m': cutoff.setMonth(cutoff.getMonth() - 6); break;
      case '1y': cutoff.setFullYear(cutoff.getFullYear() - 1); break;
      default: cutoff.setDate(cutoff.getDate() - 30);
    }

    // Filter and group data
    // Assuming data contains createdAt ISO strings or timestamps
    const filtered = data.filter(item => {
      const date = parseItemDate(item);
      return date >= cutoff;
    });

    // Group by Day (for 7d/30d) or Month (for 3m/6m/1y)
    const isMonthly = ['3m', '6m', '1y'].includes(timeRange);
    
    const grouped = filtered.reduce((acc, curr) => {
      const d = parseItemDate(curr);
      let key = '';
      let displayLabel = '';
      
      if (isMonthly) {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        displayLabel = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        displayLabel = d.toLocaleString('default', { month: 'short', day: 'numeric' });
      }
      
      if (!acc[key]) {
        acc[key] = { key, displayLabel, totalAccPercent: 0, totalRejPercent: 0, validInspections: 0 };
      }
      
      const inspected = Number(curr.qInspected) || 0;
      const passed = Number(curr.qPassed) || 0;
      const rejected = Number(curr.qRejected) || 0;

      if (inspected > 0) {
        acc[key].totalAccPercent += (passed / inspected) * 100;
        acc[key].totalRejPercent += (rejected / inspected) * 100;
        acc[key].validInspections += 1;
      }
      
      return acc;
    }, {});

    // Convert object to array, calculate rates, sort by date
    return Object.values(grouped)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(item => {
        const accRate = item.validInspections > 0 ? (item.totalAccPercent / item.validInspections) : 0;
        const rejRate = item.validInspections > 0 ? (item.totalRejPercent / item.validInspections) : 0;
        return {
          name: item.displayLabel,
          'Acceptance Rate': Number(accRate.toFixed(2)),
          'Reject Rate': Number(rejRate.toFixed(2))
        };
      });
  }, [data, timeRange]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md border border-primary/20 p-3 rounded-xl shadow-lg">
          <p className="font-bold text-on-surface mb-2 border-b border-primary/10 pb-1">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-body-sm text-on-surface-variant capitalize">{entry.name}:</span>
              <span className="font-bold text-on-surface">{entry.value}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/90 backdrop-blur-md border border-primary/10 rounded-2xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary-container text-primary p-2 rounded-lg">
            <span className="material-symbols-outlined">monitoring</span>
          </div>
          <div>
            <h2 className="text-title-lg font-bold text-on-surface">Quality Performance Trend</h2>
            <p className="text-body-sm text-on-surface-variant">Acceptance vs Reject rates over time</p>
          </div>
        </div>
        
        {/* Time Filters */}
        <div className="flex bg-surface-container-lowest border border-outline-variant rounded-lg p-1">
          {[
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: '3m', label: '3 Mos' },
            { id: '6m', label: '6 Mos' },
            { id: '1y', label: '1 Year' }
          ].map(period => (
            <button
              key={period.id}
              onClick={() => setTimeRange(period.id)}
              className={`px-3 py-1 text-label-sm font-medium rounded-md transition-colors ${
                timeRange === period.id 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-on-surface-variant hover:bg-surface-variant'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px] w-full">
        {chartData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl opacity-50 mb-2">trending_flat</span>
            <p>Not enough data for this time period.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line 
                type="monotone" 
                dataKey="Acceptance Rate" 
                stroke="#0ea5e9" // primary (sky blue)
                strokeWidth={3}
                dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: '#e0f2fe', strokeWidth: 4 }}
                animationDuration={1500}
              />
              <Line 
                type="monotone" 
                dataKey="Reject Rate" 
                stroke="#ef4444" // red-500
                strokeWidth={3}
                dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: '#fee2e2', strokeWidth: 4 }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default QualityTrendChart;
