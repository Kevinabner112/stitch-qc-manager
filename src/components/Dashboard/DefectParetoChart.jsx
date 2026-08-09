import React, { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DefectParetoChart = ({ data }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Filter only rejected inspections
    const defects = data.filter(d => Number(d.qRejected) > 0);

    const counts = defects.reduce((acc, curr) => {
      const cat = curr.defectCategory || 'Uncategorized';
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += Number(curr.qRejected);
      return acc;
    }, {});

    const sortedCounts = Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const totalDefects = sortedCounts.reduce((sum, item) => sum + item.count, 0);

    let cumulative = 0;
    return sortedCounts.map(item => {
      cumulative += item.count;
      return {
        category: item.category,
        count: item.count,
        cumulativePercentage: totalDefects > 0 ? Number(((cumulative / totalDefects) * 100).toFixed(1)) : 0
      };
    });
  }, [data]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md border border-primary/20 p-3 rounded-xl shadow-lg z-50">
          <p className="font-bold text-on-surface mb-2 border-b border-primary/10 pb-1">{label}</p>
          <div className="flex items-center gap-2 mb-1">
             <div className="w-3 h-3 rounded-full bg-red-500"></div>
             <span className="text-body-sm text-on-surface-variant">Count:</span>
             <span className="font-bold text-on-surface">{payload[0]?.value}</span>
          </div>
          {payload[1] && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-body-sm text-on-surface-variant">Cumulative:</span>
              <span className="font-bold text-on-surface">{payload[1]?.value}%</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) return null;

  return (
    <div className="bg-white/90 backdrop-blur-md border border-primary/10 rounded-2xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow mt-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-[#fef2f2] text-[#ef4444] p-2 rounded-lg">
          <span className="material-symbols-outlined">warning</span>
        </div>
        <div>
          <h2 className="text-title-lg font-bold text-on-surface">Defect Pareto Analysis</h2>
          <p className="text-body-sm text-on-surface-variant">Root cause analysis</p>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 11 }} 
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              yAxisId="left"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }}
              domain={[0, 100]}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
            <Bar yAxisId="left" dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={60} />
            <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DefectParetoChart;
