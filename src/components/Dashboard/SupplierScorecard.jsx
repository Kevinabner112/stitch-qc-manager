import React, { useMemo } from 'react';
import { getGrade } from '../../utils/grading';

const SupplierScorecard = ({ data }) => {
  const scorecard = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Group by supplier
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
          acceptanceRate: Number(accRate.toFixed(1)),
          grade: getGrade(accRate)
        };
      })
      .sort((a, b) => b.acceptanceRate - a.acceptanceRate);
  }, [data]);

  if (scorecard.length === 0) return null;

  return (
    <div className="bg-white/90 backdrop-blur-md border border-primary/10 rounded-2xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-[#eff6ff] text-[#3b82f6] p-2 rounded-lg">
          <span className="material-symbols-outlined">military_tech</span>
        </div>
        <div>
          <h2 className="text-title-lg font-bold text-on-surface">Supplier Scorecard</h2>
          <p className="text-body-sm text-on-surface-variant">Grading based on historical acceptance rate</p>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[300px]">
        <table className="w-full text-left text-sm text-on-surface">
          <thead className="bg-surface-container-low text-on-surface-variant uppercase text-xs font-semibold sticky top-0">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Supplier</th>
              <th className="px-4 py-3 text-center">Acceptance Rate</th>
              <th className="px-4 py-3 text-center rounded-tr-lg">Grade</th>
            </tr>
          </thead>
          <tbody>
            {scorecard.map((s, idx) => (
              <tr key={idx} className="border-b border-outline-variant/30 hover:bg-surface-container-lowest transition-colors">
                <td className="px-4 py-3 font-medium">{s.supplier}</td>
                <td className="px-4 py-3 text-center">{s.acceptanceRate}%</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                    s.grade === 'A' ? 'bg-[#dcfce7] text-[#16a34a]' :
                    s.grade === 'B' ? 'bg-[#fef9c3] text-[#ca8a04]' :
                    s.grade === 'C' ? 'bg-[#ffedd5] text-[#ea580c]' :
                    'bg-[#fee2e2] text-[#ef4444]'
                  }`}>
                    {s.grade}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierScorecard;
