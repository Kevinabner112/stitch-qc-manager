import React, { useState, useEffect } from 'react';
import { useInspectionStore } from '../store/useInspectionStore';
import { getStatusText } from '../utils/grading';

const SupplierPerformance = () => {
  const { masterSuppliers, inspections } = useInspectionStore();
  const [selectedSupplier, setSelectedSupplier] = useState('');

  const activeSuppliers = masterSuppliers.filter(s => s.status === 'Active');

  useEffect(() => {
    if (activeSuppliers.length > 0 && !selectedSupplier) {
      setSelectedSupplier(activeSuppliers[0].name);
    }
  }, [activeSuppliers, selectedSupplier]);

  // Aggregate metrics for selected supplier
  const supplierInspections = inspections.filter(i => i.supplier === selectedSupplier);
  
  let totalInspected = 0;
  let totalPassed = 0;
  let totalRejected = 0;
  const defectCounts = {};
  
  let validInspectionsCount = 0;
  let totalAcceptancePercentage = 0;

  supplierInspections.forEach(i => {
    const inspected = Number(i.qInspected) || 0;
    const passed = Number(i.qPassed) || 0;
    const r = Number(i.qRejected) || 0;
    
    totalInspected += inspected;
    totalPassed += passed;
    totalRejected += r;
    
    if (inspected > 0) {
      totalAcceptancePercentage += (passed / inspected) * 100;
      validInspectionsCount++;
    }
    
    if (r > 0 && i.defectCategory) {
      defectCounts[i.defectCategory] = (defectCounts[i.defectCategory] || 0) + r;
    }
  });

  const acceptanceRate = validInspectionsCount > 0 
    ? totalAcceptancePercentage / validInspectionsCount 
    : 100;
    
  const overallQualityScore = acceptanceRate.toFixed(2);
  const gradeText = getStatusText(acceptanceRate);

  // Prepare defect data for chart
  const defectEntries = Object.entries(defectCounts).sort((a, b) => b[1] - a[1]);
  const totalDefectsFound = totalRejected;
  
  // Colors for chart parts (just using generic tailwind colors)
  const chartColors = [
    { text: 'text-primary-container', bg: 'bg-primary-container' },
    { text: 'text-secondary', bg: 'bg-secondary' },
    { text: 'text-tertiary-container', bg: 'bg-tertiary-container' },
    { text: 'text-surface-variant', bg: 'bg-surface-variant' }
  ];

  // Helper to render defect legend rows
  const renderDefectsLegend = () => {
    if (defectEntries.length === 0) {
      return (
        <div className="col-span-full p-4 text-center text-on-surface-variant bg-surface-container-low rounded-lg">
          No defects recorded for this supplier.
        </div>
      );
    }
    
    return defectEntries.map(([category, count], index) => {
      const color = chartColors[Math.min(index, chartColors.length - 1)];
      const percentage = Math.round((count / totalDefectsFound) * 100);
      
      return (
        <div key={category} className="flex items-center gap-3 p-3 rounded-lg bg-surface hover:bg-surface-container transition-colors border border-outline-variant/30 shadow-sm">
          <div className={`w-4 h-4 rounded-full ${color.bg} flex-shrink-0 ${index >= 3 ? 'border border-outline-variant' : ''}`}></div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-body-md text-on-surface font-medium truncate max-w-[120px]" title={category}>{category}</span>
              <span className="text-data-mono font-bold text-on-surface">{percentage}%</span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div className={`${color.bg} h-full rounded-full`} style={{ width: `${percentage}%` }}></div>
            </div>
          </div>
        </div>
      );
    });
  };

  // Helper to build the SVG donut chart strokes
  const renderDonutChart = () => {
    if (defectEntries.length === 0) {
      return (
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <path className="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="6"></path>
        </svg>
      );
    }

    let cumulativePercentage = 0;
    return (
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
        {/* Base circle */}
        <path className="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="6"></path>
        
        {/* We draw backwards so the smaller pieces overlap correctly, or use stroke-dashoffset */}
        {defectEntries.map(([_, count], index) => {
          const color = chartColors[Math.min(index, chartColors.length - 1)];
          const percentage = (count / totalDefectsFound) * 100;
          // dasharray is: length, gap. For a circle of r=15.9155, circumference is 100.
          // dashoffset shifts the start position
          const dashArray = `${percentage}, 100`;
          const dashOffset = -cumulativePercentage;
          cumulativePercentage += percentage;
          
          return (
            <path 
              key={index}
              className={`${color.text} transition-all duration-500`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
              fill="none" 
              stroke="currentColor" 
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeWidth="6"
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div className="p-lg flex flex-col gap-lg max-w-[1440px] mx-auto">
      {/* Header & Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-sm mb-sm">
        <div>
          <h1 className="text-headline-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Supplier Performance
          </h1>
          <p className="text-body-md text-white/90">Analyze scorecard and defect metrics.</p>
        </div>
        <div className="relative w-full md:w-64">
          <select 
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="block w-full rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-primary focus:ring-2 sm:text-sm p-3 appearance-none h-12 shadow-sm font-body-md cursor-pointer transition-colors"
          >
            {activeSuppliers.map(sup => (
              <option key={sup.id} value={sup.name}>{sup.name}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant">
            <span className="material-symbols-outlined">expand_more</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        
        {/* Scorecard Summary */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm relative overflow-hidden flex flex-col justify-between h-full group hover:shadow-md transition-shadow min-h-[220px]">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-headline-md text-on-surface mb-1">Scorecard Summary</h3>
              <div className="inline-flex items-center gap-1 bg-surface-tint/10 text-primary-container px-2 py-1 rounded-full text-label-caps tracking-wide font-bold">
                <span className="material-symbols-outlined text-[14px]">{acceptanceRate >= 95 ? 'check_circle' : 'warning'}</span>
                {gradeText}
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <span className="text-3xl sm:text-4xl md:text-[48px] font-bold text-on-surface leading-tight block whitespace-nowrap">{overallQualityScore}%</span>
              <span className="text-xs sm:text-sm md:text-body-md text-on-surface-variant text-right block">Overall Quality<br className="sm:hidden" /> Score</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 sm:gap-sm mt-auto pt-lg border-t border-outline-variant/30">
            <div>
              <p className="text-xs sm:text-body-md text-on-surface-variant mb-1">Inspected</p>
              <p className="text-base sm:text-lg md:text-xl lg:text-headline-md text-on-surface font-data-mono">{totalInspected.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs sm:text-body-md text-on-surface-variant mb-1">Passed</p>
              <p className="text-base sm:text-lg md:text-xl lg:text-headline-md text-primary-container font-data-mono flex flex-wrap items-center gap-1">
                <span className="material-symbols-outlined text-[14px] sm:text-[18px]">thumb_up</span> {totalPassed.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-body-md text-on-surface-variant mb-1">Rejected</p>
              <p className="text-base sm:text-lg md:text-xl lg:text-headline-md text-error font-data-mono flex flex-wrap items-center gap-1">
                <span className="material-symbols-outlined text-[14px] sm:text-[18px]">warning</span> {totalRejected.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-[180px]" style={{ fontVariationSettings: "'FILL' 1" }}>assignment_turned_in</span>
          </div>
        </div>

        {/* Benchmark Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm h-full flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4 border-b border-outline-variant/30 pb-3">
            <span className="material-symbols-outlined text-on-surface-variant">speed</span>
            <h3 className="text-body-lg font-semibold text-on-surface">Grade Benchmarks</h3>
          </div>
          <div className="space-y-3 flex-1 flex flex-col justify-center">
            <div className={`flex justify-between items-center group ${acceptanceRate >= 98 ? 'bg-emerald-50 -mx-2 px-2 py-1 rounded-md' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm border border-emerald-200">A</div>
                <span className="text-body-md text-on-surface">Excellent</span>
              </div>
              <span className="text-data-mono text-on-surface-variant group-hover:text-on-surface transition-colors">≥ 98.00%</span>
            </div>
            <div className={`flex justify-between items-center group ${acceptanceRate >= 95 && acceptanceRate < 98 ? 'bg-primary-container/5 -mx-2 px-2 py-1 rounded-md ring-1 ring-primary/20' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-primary-container flex items-center justify-center font-bold text-sm border border-blue-200 shadow-sm">B</div>
                <span className="text-body-md text-on-surface">Good</span>
              </div>
              <span className="text-data-mono text-on-surface-variant group-hover:text-on-surface transition-colors">95.00 - 97.99%</span>
            </div>
            <div className={`flex justify-between items-center group ${acceptanceRate >= 90 && acceptanceRate < 95 ? 'bg-amber-50 -mx-2 px-2 py-1 rounded-md' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm border border-amber-200">C</div>
                <span className="text-body-md text-on-surface">Fair</span>
              </div>
              <span className="text-data-mono text-on-surface-variant group-hover:text-on-surface transition-colors">90.00 - 94.99%</span>
            </div>
            <div className={`flex justify-between items-center group ${acceptanceRate < 90 && totalInspected > 0 ? 'bg-red-50 -mx-2 px-2 py-1 rounded-md' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 text-error flex items-center justify-center font-bold text-sm border border-red-200">D</div>
                <span className="text-body-md text-on-surface">Critical</span>
              </div>
              <span className="text-data-mono text-on-surface-variant group-hover:text-on-surface transition-colors">&lt; 90.00%</span>
            </div>
          </div>
        </div>

        {/* Defect Breakdown Analysis */}
        <div className="lg:col-span-3 bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6 border-b border-outline-variant/30 pb-4">
            <h3 className="text-headline-md text-on-surface">Defect Causes for {selectedSupplier}</h3>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-lg">
            {/* Donut Chart */}
            <div className="relative w-48 h-48 flex-shrink-0">
              {renderDonutChart()}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-body-md text-on-surface-variant">Total Defects</span>
                <span className="text-headline-md font-bold text-on-surface">{totalDefectsFound.toLocaleString()}</span>
              </div>
            </div>

            {/* Legend & Data */}
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderDefectsLegend()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierPerformance;
