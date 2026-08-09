import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useInspectionStore } from '../store/useInspectionStore';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

const dataUrlToFile = async (dataUrl, filename) => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: 'image/jpeg' });
};

const History = () => {
  const { inspections, deleteInspection, updateInspection } = useInspectionStore();
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [editingDateId, setEditingDateId] = useState(null);
  const [editDateValue, setEditDateValue] = useState('');
  const timerRef = useRef(null);

  const handlePressStart = (id) => {
    if (isSelectMode) return;
    timerRef.current = setTimeout(() => {
      setIsSelectMode(true);
      setSelectedIds([id]);
    }, 2000); // 2000ms long press
  };

  const handlePressEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [itemNoFilter, setItemNoFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, supplierFilter, itemNoFilter]);

  const uniqueSuppliers = useMemo(() => {
    return Array.from(new Set(inspections.map(i => i.supplier).filter(Boolean)))
      .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }));
  }, [inspections]);

  const uniqueItemNos = useMemo(() => {
    let filtered = inspections;
    if (supplierFilter) {
      filtered = filtered.filter(i => i.supplier === supplierFilter);
    }
    return Array.from(new Set(filtered.map(i => i.itemNo).filter(Boolean)))
      .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }));
  }, [inspections, supplierFilter]);

  // Filter inspections by date and search query
  const filteredInspections = useMemo(() => {
    const filtered = inspections.filter(item => {
      // Dropdown filters
      if (supplierFilter && item.supplier !== supplierFilter) return false;
      if (itemNoFilter && item.itemNo !== itemNoFilter) return false;

      // Date filter
      if (!startDate && !endDate) return true;
      
      const itemDateStr = item.date || (item.createdAt ? item.createdAt.split('T')[0] : '');
      if (!itemDateStr) return true; // If no date, include it or exclude it? Let's include.
      
      const itemDate = new Date(itemDateStr);
      itemDate.setHours(0,0,0,0);
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        if (itemDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23,59,59,999);
        if (itemDate > end) return false;
      }
      
      return true;
    });

    // Sort descending by date
    filtered.sort((a, b) => {
      const getTimestamp = (item) => {
        if (item.date) {
          const parts = item.date.split('/');
          if (parts.length === 3) {
            const ts = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
            if (!isNaN(ts)) return ts;
          }
          const ts2 = new Date(item.date).getTime();
          if (!isNaN(ts2)) return ts2;
        }
        if (item.createdAt) {
          if (typeof item.createdAt.toMillis === 'function') return item.createdAt.toMillis();
          const ts = new Date(item.createdAt).getTime();
          if (!isNaN(ts)) return ts;
        }
        return 0;
      };
      
      const timeA = getTimestamp(a);
      const timeB = getTimestamp(b);
      
      // If timestamps are equal (e.g. same day but no time), fallback to firebaseId string comparison to ensure stable sort
      if (timeB === timeA) {
        const idA = a.firebaseId || '';
        const idB = b.firebaseId || '';
        return idB.localeCompare(idA);
      }
      return timeB - timeA;
    });

    return filtered;
  }, [inspections, startDate, endDate, supplierFilter, itemNoFilter]);

  const handleShare = async (item) => {
    try {
      const dateStr = item.date || new Date(item.createdAt || Date.now()).toLocaleDateString('id-ID');
      const text = `*Laporan Inspeksi QC*\nTanggal: ${dateStr}\nSupplier: ${item.supplier}\nItem: ${item.itemNo} - ${item.itemName || 'N/A'}\n\n*Hasil*\nInspected: ${item.qInspected} ${item.uom || 'Pcs'}\nPassed: ${item.qPassed} ${item.uom || 'Pcs'}\nRejected: ${item.qRejected} ${item.uom || 'Pcs'}\n\n*Kategori Defect*: ${item.defectCategory || '-'}\n*Catatan*: ${item.notes || '-'}`;
      
      let filesArray = [];
      if (item.photos && item.photos.length > 0) {
        const file = await dataUrlToFile(item.photos[0], `Evidence_${item.id}.jpg`);
        filesArray.push(file);
      }

      if (navigator.canShare && navigator.canShare({ files: filesArray })) {
        await navigator.share({
          title: 'Laporan Inspeksi QC',
          text: text,
          files: filesArray
        });
      } else if (navigator.share) {
        await navigator.share({
          title: 'Laporan Inspeksi QC',
          text: text
        });
      } else {
        const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleExport = () => {
    if (filteredInspections.length === 0) return;
    
    const exportData = filteredInspections.map(item => {
      const inspected = Number(item.qInspected) || 0;
      const passed = Number(item.qPassed) || 0;
      const accRate = inspected > 0 ? Math.round((passed / inspected) * 100) : 0;
      const rejRate = inspected > 0 ? 100 - accRate : 0;
      
      return {
        'Inspection ID': item.id,
        'Supplier': item.supplier,
        'Item No': item.itemNo,
        'Item Name': item.itemName || '-',
        'Date': item.date || (item.createdAt ? item.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
        'Inspected Qty': inspected,
        'Passed Qty': passed,
        'Rejected Qty': Number(item.qRejected) || 0,
        'UoM': item.uom || 'Pcs',
        'Acceptance Rate (%)': accRate,
        'Reject Rate (%)': rejRate,
        'Defect Category': item.defectCategory || 'N/A',
        'Notes': item.notes || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inspections");
    XLSX.writeFile(workbook, "Inspection_History.xlsx");
  };

  const handleExportPDF = () => {
    if (selectedIds.length === 0) {
      alert("Pilih data inspeksi terlebih dahulu (Gunakan fitur Tahan Lama pada data).");
      return;
    }
    const selectedItems = filteredInspections.filter(item => selectedIds.includes(item.firebaseId || item.id));
    
    const doc = new jsPDF();
    
    selectedItems.forEach((item, index) => {
      if (index > 0) doc.addPage();
      
      let y = 20;
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Laporan Inspeksi QC", 14, y);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      y += 15;
      
      const dateStr = item.date || new Date(item.createdAt || Date.now()).toLocaleDateString('id-ID');
      doc.text(`Tanggal: ${dateStr}`, 14, y);
      y += 7;
      doc.text(`Supplier: ${item.supplier}`, 14, y);
      y += 7;
      doc.text(`Item: ${item.itemNo} - ${item.itemName || 'N/A'}`, 14, y);
      y += 10;
      
      doc.setFont("helvetica", "bold");
      doc.text("Hasil Inspeksi", 14, y);
      doc.setFont("helvetica", "normal");
      y += 7;
      
      doc.text(`Inspected: ${item.qInspected} ${item.uom || 'Pcs'}`, 14, y);
      y += 7;
      doc.text(`Passed: ${item.qPassed} ${item.uom || 'Pcs'}`, 14, y);
      y += 7;
      doc.text(`Rejected: ${item.qRejected} ${item.uom || 'Pcs'}`, 14, y);
      y += 10;
      
      doc.setFont("helvetica", "bold");
      doc.text("Keterangan", 14, y);
      doc.setFont("helvetica", "normal");
      y += 7;
      
      doc.text(`Kategori Defect: ${item.defectCategory || '-'}`, 14, y);
      y += 7;
      doc.text(`Catatan: ${item.notes || '-'}`, 14, y);
      y += 15;
      
      if (item.photos && item.photos.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Foto Bukti Defect:", 14, y);
        y += 10;
        
        try {
          doc.addImage(item.photos[0], 'JPEG', 14, y, 100, 100);
        } catch (e) {
          console.error("Failed to add image to PDF", e);
        }
      }
    });
    
    doc.save("Inspection_Report.pdf");
  };

  const totalPages = Math.ceil(filteredInspections.length / itemsPerPage);
  const paginatedInspections = filteredInspections.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredInspections.map(item => item.firebaseId || item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (e, id) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(itemId => itemId !== id));
    }
  };

  const handleDeleteSelected = () => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} data inspeksi terpilih?`)) {
      selectedIds.forEach(id => {
        deleteInspection(id);
      });
      setSelectedIds([]);
      setIsSelectMode(false);
    }
  };

  const handleCancelSelect = () => {
    setIsSelectMode(false);
    setSelectedIds([]);
  };

  const handleBulkShare = async () => {
    if (selectedIds.length === 0) return;
    
    try {
      const selectedItems = filteredInspections.filter(item => selectedIds.includes(item.firebaseId || item.id));
      
      let text = ``;
      let allFiles = [];

      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        const dateStr = item.date || new Date(item.createdAt || Date.now()).toLocaleDateString('id-ID');
        text += `*Laporan Inspeksi QC*\nTanggal: ${dateStr}\nSupplier: ${item.supplier}\nItem: ${item.itemNo} - ${item.itemName || 'N/A'}\n\n*Hasil*\nInspected: ${item.qInspected} ${item.uom || 'Pcs'}\nPassed: ${item.qPassed} ${item.uom || 'Pcs'}\nRejected: ${item.qRejected} ${item.uom || 'Pcs'}\n\n*Kategori Defect*: ${item.defectCategory || '-'}\n*Catatan*: ${item.notes || '-'}`;
        
        if (i < selectedItems.length - 1) {
          text += `\n\n========================\n\n`;
        }
        
        if (item.photos && item.photos.length > 0) {
          for (let j = 0; j < item.photos.length; j++) {
            const file = await dataUrlToFile(item.photos[j], `Evidence_Data${i+1}_${j + 1}.jpg`);
            allFiles.push(file);
          }
        }
      }

      if (navigator.canShare && navigator.canShare({ files: allFiles })) {
        await navigator.share({
          title: 'Laporan Inspeksi QC (Bulk)',
          text: text,
          files: allFiles
        });
      } else if (navigator.share) {
        await navigator.share({
          title: 'Laporan Inspeksi QC (Bulk)',
          text: text
        });
      } else {
        const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
      }
      
      handleCancelSelect();
    } catch (error) {
      console.error('Error sharing bulk data:', error);
      if (error.name !== 'AbortError') {
        alert('Gagal membagikan data. Browser Anda mungkin tidak mendukung fitur berbagi banyak file sekaligus, atau total ukuran file terlalu besar.');
      }
    }
  };

  return (
    <div className="p-lg max-w-[1440px] mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-md gap-sm">
        <h1 className="text-headline-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          Inspection History
        </h1>
        
        <div className="flex flex-col lg:flex-row gap-md items-end lg:items-center w-full md:w-auto">
          {/* Dropdown Filters */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <select 
              value={supplierFilter}
              onChange={(e) => {
                setSupplierFilter(e.target.value);
                setItemNoFilter(''); // Reset item no when supplier changes
              }}
              className="bg-white/80 backdrop-blur-md border border-primary/20 rounded-lg px-3 py-2 text-sm text-on-surface shadow-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none min-w-[160px] w-full sm:w-auto"
            >
              <option value="">Semua Supplier</option>
              {uniqueSuppliers.map(sup => (
                <option key={sup} value={sup}>{sup}</option>
              ))}
            </select>

            <select 
              value={itemNoFilter}
              onChange={(e) => setItemNoFilter(e.target.value)}
              className="bg-white/80 backdrop-blur-md border border-primary/20 rounded-lg px-3 py-2 text-sm text-on-surface shadow-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none min-w-[160px] w-full sm:w-auto"
            >
              <option value="">Semua Item No</option>
              {uniqueItemNos.map(itemNo => (
                <option key={itemNo} value={itemNo}>{itemNo}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md p-2 rounded-lg border border-primary/20 w-full sm:w-auto shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] text-primary font-bold ml-1 uppercase">Dari</span>
              <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-transparent text-sm border-none outline-none text-on-surface font-medium"
              />
            </div>
            <div className="w-px h-8 bg-primary/20 mx-1"></div>
            <div className="flex flex-col">
              <span className="text-[10px] text-primary font-bold ml-1 uppercase">Sampai</span>
              <input 
                type="date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-transparent text-sm border-none outline-none text-on-surface font-medium"
              />
            </div>
          </div>
          
          {(startDate || endDate || supplierFilter || itemNoFilter) && (
            <button 
              onClick={() => { setStartDate(''); setEndDate(''); setSupplierFilter(''); setItemNoFilter(''); }}
              className="flex items-center gap-1 text-sm font-medium text-error hover:bg-error/10 px-3 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center border border-error/20"
              title="Clear Filters"
            >
              <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
              Clear
            </button>
          )}

          <div className="flex w-full sm:w-auto gap-2">
            <button 
              onClick={handleExportPDF}
              disabled={selectedIds.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-xs bg-error text-white py-2 px-md rounded-md font-label-caps tracking-wider hover:bg-error/90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              title="Pilih data terlebih dahulu dengan menahan data"
            >
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              EXPORT PDF
            </button>
            <button 
              onClick={handleExport}
              disabled={filteredInspections.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-xs bg-gradient-to-r from-primary to-secondary text-white py-2 px-md rounded-md font-label-caps tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              EXPORT EXCEL
            </button>
          </div>
        </div>
      </div>
      
      {/* Delete Bulk Action Bar */}
      {isSelectMode && (
        <div className="flex flex-col sm:flex-row justify-between items-center bg-error-container/10 border border-error/20 p-3 rounded-lg mb-4 shadow-sm animate-in fade-in slide-in-from-top-4">
          <span className="font-bold text-error mb-3 sm:mb-0">
            {selectedIds.length > 0 ? `${selectedIds.length} item terpilih` : 'Pilih data untuk dihapus'}
          </span>
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={handleCancelSelect}
              className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-outline-variant hover:bg-surface-container-low rounded-lg text-xs font-bold transition-colors"
            >
              Batal Pilih
            </button>
            <button 
              onClick={handleBulkShare}
              disabled={selectedIds.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 bg-[#25D366] hover:bg-[#20b858] text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">share</span>
              Share Data
            </button>
            <button 
              onClick={handleDeleteSelected}
              disabled={selectedIds.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 bg-error hover:bg-error/90 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Hapus Data
            </button>
          </div>
        </div>
      )}
      
      {filteredInspections.length === 0 ? (
        <div className="text-center py-xl bg-white/60 backdrop-blur-sm rounded-xl border border-primary/10 shadow-sm mt-4">
          <span className="material-symbols-outlined text-[48px] text-primary/40 mb-2">inbox</span>
          <p className="text-on-surface-variant text-body-lg font-bold">Empty</p>
          <p className="text-on-surface-variant text-body-sm mt-1">Tidak ada item yang valid.</p>
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-md rounded-xl border border-primary/10 shadow-sm mt-4 overflow-hidden">

          
          <div className="flex flex-col divide-y divide-primary/5">
            {paginatedInspections.map((item, index) => {
              const itemId = item.firebaseId || item.id || index;
              const isExpanded = expandedId === itemId;
              const dateObj = item.date ? new Date(item.date) : (item.createdAt ? new Date(item.createdAt) : new Date());
              const dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
              const acceptanceRate = item.qInspected > 0 ? Math.round((item.qPassed / item.qInspected) * 100) : 0;
              
              return (
                <div 
                  key={itemId} 
                  className="bg-white hover:bg-primary/5 transition-colors overflow-hidden relative select-none"
                  onMouseDown={() => handlePressStart(itemId)}
                  onMouseUp={handlePressEnd}
                  onMouseLeave={handlePressEnd}
                  onTouchStart={() => handlePressStart(itemId)}
                  onTouchEnd={handlePressEnd}
                >
                  {/* Summary Header (Always Visible) */}
                  <div 
                    className={`px-3 py-2.5 sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-3 cursor-pointer transition-colors ${isSelectMode && selectedIds.includes(itemId) ? 'bg-error/5' : ''}`}
                    onClick={() => {
                      if (isSelectMode) {
                        setSelectedIds(prev => prev.includes(itemId) ? prev.filter(i => i !== itemId) : [...prev, itemId]);
                      } else {
                        toggleExpand(itemId);
                      }
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 flex-1 min-w-[200px]">
                      {isSelectMode && (
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(itemId)}
                          readOnly
                          className="w-5 h-5 accent-error rounded flex-shrink-0 pointer-events-none"
                        />
                      )}
                      <span className="text-xs font-semibold text-primary/90 whitespace-nowrap bg-primary/5 px-2 py-0.5 rounded border border-primary/10 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        {dateStr}
                      </span>
                      <span className="font-bold text-on-surface text-sm whitespace-nowrap">{item.itemNo}</span>
                      <span className="text-xs text-on-surface-variant flex-1 min-w-[140px] leading-snug break-words">
                        {item.itemName ? `${item.itemName} (${item.supplier})` : item.supplier}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 ml-auto">
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold uppercase text-on-surface-variant tracking-wider">Acc. Rate</span>
                        <span className={`font-bold text-sm leading-none mt-0.5 ${acceptanceRate >= 90 ? 'text-[#166534]' : 'text-error'}`}>
                          {acceptanceRate}%
                        </span>
                      </div>
                      <span className={`material-symbols-outlined text-[20px] text-on-surface-variant transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Expanded Details Section */}
                  <div 
                    className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                  >
                    <div className="overflow-hidden">
                      <div className="p-3 bg-surface-container-lowest border-t border-primary/5 flex flex-col md:flex-row gap-4">
                        
                        {/* Left: Stats & Notes */}
                        <div className="flex-1 space-y-3">
                          <div className="flex gap-3">
                            <div className="flex-1 bg-[#f0fdf4] border border-[#16a34a]/20 p-2 rounded text-center shadow-sm">
                              <p className="text-[9px] font-bold text-[#166534] uppercase">Passed</p>
                              <p className="font-black text-[#166534] text-sm sm:text-base">{item.qPassed} <span className="text-[9px] font-normal opacity-70">{item.uom || 'Pcs'}</span></p>
                            </div>
                            <div className="flex-1 bg-error-container/30 border border-error/20 p-2 rounded text-center shadow-sm">
                              <p className="text-[9px] font-bold text-error uppercase">Rejected</p>
                              <p className="font-black text-error text-sm sm:text-base">{item.qRejected} <span className="text-[9px] font-normal opacity-70">{item.uom || 'Pcs'}</span></p>
                            </div>
                          </div>

                          <div>
                            <p className="text-[9px] font-bold text-on-surface-variant uppercase mb-0.5">Defect Category</p>
                            <p className="text-xs font-medium text-on-surface">
                              {item.qRejected > 0 ? (item.defectCategory || 'Tidak disebutkan') : '-'}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-[9px] font-bold text-on-surface-variant uppercase mb-0.5">Notes</p>
                            <p className="text-xs text-on-surface bg-surface-container-low p-2 rounded border border-outline-variant/30">
                              {item.notes || 'Tidak ada catatan.'}
                            </p>
                          </div>
                        </div>

                        {/* Right: Photos & Actions */}
                        <div className="md:w-[200px] flex flex-col gap-3">
                          <div>
                            <p className="text-[9px] font-bold text-on-surface-variant uppercase mb-1.5">Evidence Photos</p>
                            {item.photos && item.photos.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {item.photos.map((photo, index) => (
                                  <div key={index} className="relative w-12 h-12 sm:w-14 sm:h-14 rounded overflow-hidden border border-outline-variant shadow-sm group">
                                    <img 
                                      src={photo} 
                                      alt={`Evidence ${index + 1}`} 
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                    />
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setSelectedPhoto(photo); }}
                                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer w-full h-full"
                                    >
                                      <span className="material-symbols-outlined text-white text-[16px]">zoom_in</span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-on-surface-variant italic">Tidak ada foto</p>
                            )}
                          </div>

                          <div className="mt-auto pt-3 border-t border-outline-variant/30 flex flex-col gap-2">
                            {editingDateId === itemId ? (
                              <div className="flex flex-col gap-2 bg-surface-container-low p-2 rounded border border-outline-variant" onClick={e => e.stopPropagation()}>
                                <label className="text-[10px] font-bold text-primary">Ubah Tanggal:</label>
                                <input 
                                  type="date" 
                                  value={editDateValue} 
                                  onChange={(e) => setEditDateValue(e.target.value)}
                                  className="w-full text-xs rounded border border-outline-variant px-2 py-1 focus:outline-none focus:border-primary"
                                />
                                <div className="flex gap-2 mt-1">
                                  <button 
                                    onClick={() => setEditingDateId(null)}
                                    className="flex-1 text-[10px] bg-white border border-outline-variant py-1 rounded font-bold hover:bg-surface-container-lowest transition-colors"
                                  >
                                    Batal
                                  </button>
                                  <button 
                                    onClick={() => { 
                                      if (editDateValue) {
                                        updateInspection(itemId, { date: editDateValue });
                                        setEditingDateId(null);
                                      }
                                    }}
                                    className="flex-1 text-[10px] bg-primary text-white py-1 rounded font-bold hover:bg-primary/90 transition-colors"
                                  >
                                    Simpan
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setEditingDateId(itemId); 
                                  const initialDate = item.date || (item.createdAt ? item.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]);
                                  let formattedDate = initialDate;
                                  if (initialDate.includes('/')) {
                                    const parts = initialDate.split('/');
                                    if (parts.length === 3) formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                                  }
                                  setEditDateValue(formattedDate); 
                                }}
                                className="w-full flex items-center justify-center gap-1.5 bg-white border border-outline-variant text-on-surface-variant px-2 py-1.5 rounded font-bold text-[10px] hover:bg-surface-container-low transition-colors shadow-sm"
                              >
                                <span className="material-symbols-outlined text-[14px]">edit_calendar</span>
                                UBAH TANGGAL
                              </button>
                            )}

                            <button 
                              onClick={(e) => { e.stopPropagation(); handleShare(item); }}
                              className="w-full flex items-center justify-center gap-1.5 bg-[#25D366] text-white px-2 py-1.5 rounded font-bold text-[10px] hover:bg-[#20b858] transition-colors shadow-sm"
                            >
                              <span className="material-symbols-outlined text-[14px]">share</span>
                              SHARE KE WA
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-primary/10 bg-surface-container-lowest">
              <span className="text-sm text-on-surface-variant">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredInspections.length)} of {filteredInspections.length} entries
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm font-medium rounded border border-outline-variant hover:bg-surface-container-low disabled:opacity-50 transition-colors"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm font-medium rounded border border-outline-variant hover:bg-surface-container-low disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black rounded-full p-2 transition-colors"
            onClick={() => setSelectedPhoto(null)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <img 
            src={selectedPhoto} 
            alt="Fullscreen Evidence" 
            className="max-w-full max-h-full object-contain rounded-md"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
};

export default History;
