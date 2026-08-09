import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const SupplierComparisonChart = ({ data }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const grouped = data.reduce((acc, curr) => {
      const sup = curr.supplier || 'Unknown';
      if (!acc[sup]) {
        acc[sup] = { supplier: sup, totalAccPercent: 0, validInspections: 0 };
      }
      const inspected = Number(curr.qInspected) || 0;
      const passed = Number(curr.qPassed) || 0;
      if (inspected > 0) {
        acc[sup].totalAccPercent += (passed / inspected) * 100;
        acc[sup].validInspections += 1;
      }
      return acc;
    }, {});

    return Object.values(grouped)
      .map(item => {
        const accRate = item.validInspections > 0 ? (item.totalAccPercent / item.validInspections) : 0;
        return {
          supplier: item.supplier,
          'Acceptance Rate': Number(accRate.toFixed(1)),
          'Total Inspections': item.validInspections
        };
      })
      .sort((a, b) => b['Acceptance Rate'] - a['Acceptance Rate']); // Sort highest to lowest
  }, [data]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md border border-primary/20 p-3 rounded-xl shadow-lg">
          <p className="font-bold text-on-surface mb-2 border-b border-primary/10 pb-1">{label}</p>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload['Acceptance Rate'] >= 90 ? '#16a34a' : payload[0].payload['Acceptance Rate'] >= 80 ? '#fbbf24' : '#ef4444' }}></div>
            <span className="text-body-sm text-on-surface-variant">Acceptance Rate:</span>
            <span className="font-bold text-on-surface">{payload[0].value}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-300"></div>
            <span className="text-body-sm text-on-surface-variant">Inspections:</span>
            <span className="font-bold text-on-surface">{payload[0].payload['Total Inspections']} Batches</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) return null;

  return (
    <div className="bg-white/90 backdrop-blur-md border border-primary/10 rounded-2xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow mt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-[#f0fdf4] text-[#16a34a] p-2 rounded-lg">
            <span className="material-symbols-outlined">leaderboard</span>
          </div>
          <div>
            <h2 className="text-title-lg font-bold text-on-surface">Supplier Performance Comparison</h2>
            <p className="text-body-sm text-on-surface-variant">Acceptance rate across all suppliers (Highest to Lowest)</p>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="supplier" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 11 }} 
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }}
              domain={[0, 100]}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="Acceptance Rate" radius={[4, 4, 0, 0]} maxBarSize={60}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry['Acceptance Rate'] >= 90 ? '#16a34a' : entry['Acceptance Rate'] >= 80 ? '#fbbf24' : '#ef4444'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SupplierComparisonChart;
