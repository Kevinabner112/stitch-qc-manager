import React, { useState, useMemo } from 'react';
import { useInspectionStore } from '../store/useInspectionStore';
import * as XLSX from 'xlsx';
import StatCard from '../components/Dashboard/StatCard';
import QualityTrendChart from '../components/Dashboard/QualityTrendChart';
import AnimatedCounter from '../components/Dashboard/AnimatedCounter';

const Dashboard = () => {
  const { inspections, masterSuppliers } = useInspectionStore();
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');

  // Filtered Data
  const filteredData = useMemo(() => {
    return inspections.filter(item => {
      let match = true;
      if (supplierFilter && item.supplier !== supplierFilter) match = false;
      
      const itemDate = new Date(item.date || item.createdAt || Date.now());
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (itemDate < start) match = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) match = false;
      }
      return match;
    });
  }, [inspections, startDate, endDate, supplierFilter]);

  // Calculated Metrics based on filtered data
  const metrics = useMemo(() => {
    let totalQtyInspected = 0;
    let totalQtyPassed = 0;
    let totalQtyRejected = 0;

    filteredData.forEach(i => {
      totalQtyInspected += Number(i.qInspected) || 0;
      totalQtyPassed += Number(i.qPassed) || 0;
      totalQtyRejected += Number(i.qRejected) || 0;
    });

    const acceptanceRate = totalQtyInspected > 0 ? (totalQtyPassed / totalQtyInspected) * 100 : 0;
    const rejectRate = totalQtyInspected > 0 ? (totalQtyRejected / totalQtyInspected) * 100 : 0;

    return {
      totalInspections: filteredData.length,
      totalQtyInspected,
      totalQtyPassed,
      totalQtyRejected,
      acceptanceRate: Math.round(acceptanceRate),
      rejectRate: Math.round(rejectRate)
    };
  }, [filteredData]);

  const handleExport = () => {
    const exportData = filteredData.map(item => ({
      ID: item.firebaseId || item.id,
      Date: item.date || new Date(item.createdAt || Date.now()).toLocaleDateString('id-ID'),
      Supplier: item.supplier,
      Item: item.itemNo,
      'Qty Received': item.qtyReceived,
      'Qty Inspected': item.qInspected,
      'Qty Passed': item.qPassed,
      'Qty Rejected': item.qRejected,
      'Defect Category': item.defectCategory || '-',
      Notes: item.notes || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dashboard_Report");
    XLSX.writeFile(wb, `QC_Dashboard_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="flex flex-col gap-lg max-w-[1440px] mx-auto pb-24">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-md bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-primary/10 shadow-sm">
        <div>
          <h1 className="text-headline-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-1">
            Supplier Quality Dashboard
          </h1>
          <p className="text-body-md text-on-surface-variant">Real-time performance & inspection analytics.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center w-full lg:w-auto">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <select 
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="bg-white border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface shadow-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">All Suppliers</option>
              {masterSuppliers.filter(s => s.status === 'Active').map(sup => (
                <option key={sup.id} value={sup.name}>{sup.name}</option>
              ))}
            </select>

            <div className="flex items-center gap-2 bg-white border border-outline-variant rounded-lg p-1 shadow-sm">
              <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-transparent text-sm border-none outline-none text-on-surface px-2"
                title="Start Date"
              />
              <span className="text-outline-variant material-symbols-outlined text-sm">arrow_forward</span>
              <input 
                type="date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-transparent text-sm border-none outline-none text-on-surface px-2"
                title="End Date"
              />
            </div>
            
            {(startDate || endDate || supplierFilter) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); setSupplierFilter(''); }}
                className="flex items-center justify-center p-2 text-on-surface-variant hover:text-error transition-colors bg-white border border-outline-variant rounded-lg shadow-sm"
                title="Clear Filters"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          <button 
            onClick={handleExport}
            disabled={filteredData.length === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-secondary text-white py-2 px-6 rounded-lg font-label-caps tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            EXPORT REPORT
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Inspections" 
          value={metrics.totalInspections} 
          icon="fact_check" 
          theme="neutral"
        />
        <StatCard 
          title="Total Qty Inspected" 
          value={metrics.totalQtyInspected} 
          icon="inventory_2" 
          valueSuffix="pcs"
          theme="primary"
        />
        <StatCard 
          title="Qty Passed" 
          value={metrics.totalQtyPassed} 
          icon="check_circle" 
          valueSuffix="pcs"
          theme="success"
        />
        <StatCard 
          title="Qty Rejected" 
          value={metrics.totalQtyRejected} 
          icon="cancel" 
          valueSuffix="pcs"
          theme="error"
        />
      </div>

      {/* Secondary Metrics & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rates Sidebar */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          {/* Acceptance Rate Card */}
          <div className="bg-gradient-to-br from-[#f0fdf4] to-white backdrop-blur-md rounded-2xl border border-[#16a34a]/20 shadow-sm p-6 hover:shadow-md transition-all flex flex-col justify-center h-full min-h-[200px]">
            <div className="flex justify-between items-start mb-4">
              <p className="text-label-caps text-[#16a34a] uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">verified</span> 
                Acceptance Rate
              </p>
            </div>
            <p className="text-4xl md:text-5xl lg:text-[56px] leading-tight font-bold text-[#16a34a] mb-6">
              <AnimatedCounter value={metrics.acceptanceRate} isPercentage={true} />
            </p>
            <div className="w-full bg-[#16a34a]/10 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#16a34a] h-full rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${metrics.acceptanceRate}%` }}
              ></div>
            </div>
          </div>

          {/* Reject Rate Card */}
          <div className={`backdrop-blur-md rounded-2xl border shadow-sm p-6 hover:shadow-md transition-all flex flex-col justify-center h-full min-h-[200px] ${
            metrics.rejectRate > 5 
              ? 'bg-error-container/30 border-error/30' 
              : 'bg-white/80 border-outline-variant'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <p className={`text-label-caps uppercase tracking-wider flex items-center gap-2 ${
                metrics.rejectRate > 5 ? 'text-error' : 'text-on-surface-variant'
              }`}>
                <span className="material-symbols-outlined text-[20px]">warning</span> 
                Reject Rate
              </p>
              {metrics.rejectRate > 5 && (
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
                </span>
              )}
            </div>
            <p className={`text-4xl md:text-5xl lg:text-[56px] leading-tight font-bold ${
              metrics.rejectRate > 5 ? 'text-error' : 'text-on-surface'
            }`}>
              <AnimatedCounter value={metrics.rejectRate} isPercentage={true} />
            </p>
            {metrics.rejectRate > 5 && (
              <p className="text-error text-body-sm mt-4 font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">priority_high</span>
                Reject rate is above 5% threshold
              </p>
            )}
          </div>
        </div>

        {/* Main Chart */}
        <div className="lg:col-span-2">
          <QualityTrendChart data={filteredData} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
