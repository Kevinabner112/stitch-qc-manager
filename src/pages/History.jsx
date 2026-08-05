import React, { useState, useMemo } from 'react';
import { useInspectionStore } from '../store/useInspectionStore';
import * as XLSX from 'xlsx';

const dataUrlToFile = async (dataUrl, filename) => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: 'image/jpeg' });
};

const History = () => {
  const { inspections, deleteInspection } = useInspectionStore();
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter inspections by date and search query
  const filteredInspections = useMemo(() => {
    return inspections.filter(item => {
      // Search filter
      if (searchQuery) {
        const queryTerms = searchQuery.toLowerCase().split(' ').filter(Boolean);
        const itemNoStr = String(item.itemNo || '').toLowerCase();
        const itemNameStr = String(item.itemName || '').toLowerCase();
        const supplierStr = String(item.supplier || '').toLowerCase();
        
        // Pastikan SEMUA kata kunci pencarian ada di salah satu kolom (Item No, Nama, atau Supplier)
        const matchesAll = queryTerms.every(term => 
          itemNoStr.includes(term) || itemNameStr.includes(term) || supplierStr.includes(term)
        );
        
        if (!matchesAll) {
          return false;
        }
      }

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
  }, [inspections, startDate, endDate]);

  const handleShare = async (item) => {
    try {
      const dateStr = item.date || new Date(item.createdAt || Date.now()).toLocaleDateString('id-ID');
      const text = `*Laporan Inspeksi QC*\nTanggal: ${dateStr}\nSupplier: ${item.supplier}\nItem: ${item.itemNo} - ${item.itemName || 'N/A'}\n\n*Hasil*\nInspected: ${item.qInspected}\nPassed: ${item.qPassed}\nRejected: ${item.qRejected}\n\n*Kategori Defect*: ${item.defectCategory || '-'}\n*Catatan*: ${item.notes || '-'}`;
      
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
    
    const exportData = filteredInspections.map(item => ({
      'Inspection ID': item.id,
      'Supplier': item.supplier,
      'Item No': item.itemNo,
      'Item Name': item.itemName || '-',
      'Date': item.date || (item.createdAt ? item.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
      'Inspected Qty': item.qInspected,
      'Passed Qty': item.qPassed,
      'Rejected Qty': item.qRejected,
      'Defect Category': item.defectCategory || 'N/A',
      'Notes': item.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inspections");
    XLSX.writeFile(workbook, "Inspection_History.xlsx");
  };

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
    }
  };

  return (
    <div className="p-lg max-w-[1440px] mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-md gap-sm">
        <h1 className="text-headline-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          Inspection History
        </h1>
        
        <div className="flex flex-col lg:flex-row gap-md items-end lg:items-center w-full md:w-auto">
          {/* Search Input */}
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-2 rounded-lg border border-primary/20 w-full sm:w-auto shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="Cari Item No, Nama, Supplier..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm border-none outline-none text-on-surface w-full sm:w-64"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-on-surface-variant hover:text-error">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
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
          
          {(startDate || endDate || searchQuery) && (
            <button 
              onClick={() => { setStartDate(''); setEndDate(''); setSearchQuery(''); }}
              className="flex items-center gap-1 text-sm font-medium text-error hover:bg-error/10 px-3 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center border border-error/20"
              title="Clear Filters"
            >
              <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
              Clear
            </button>
          )}

          <button 
            onClick={handleExport}
            disabled={filteredInspections.length === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-xs bg-gradient-to-r from-primary to-secondary text-white py-2 px-md rounded-md font-label-caps tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            EXPORT EXCEL
          </button>
        </div>
      </div>
      
      {filteredInspections.length > 0 && (
        <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-primary/10 shadow-sm mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
              checked={selectedIds.length === filteredInspections.length && filteredInspections.length > 0}
              onChange={handleSelectAll}
            />
            <span className="text-body-md font-medium text-on-surface">Pilih Semua</span>
          </label>
          
          {selectedIds.length > 0 && (
            <button 
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 text-error hover:text-error/80 font-medium transition-colors"
            >
              <span className="material-symbols-outlined">delete</span>
              Hapus Terpilih ({selectedIds.length})
            </button>
          )}
        </div>
      )}
      
      {filteredInspections.length === 0 ? (
        <div className="text-center py-xl bg-white/60 backdrop-blur-sm rounded-xl border border-primary/10 shadow-sm mt-4">
          <span className="material-symbols-outlined text-[48px] text-primary/40 mb-2">inbox</span>
          <p className="text-on-surface-variant text-body-lg">Tidak ada data inspeksi yang sesuai.</p>
        </div>
      ) : (
        <div className="grid gap-3 mt-4">
          {filteredInspections.map((item, index) => {
            const itemId = item.firebaseId || item.id || index;
            const isExpanded = expandedId === itemId;
            const dateStr = item.date || new Date(item.createdAt || Date.now()).toLocaleDateString('id-ID');
            const acceptanceRate = item.qInspected > 0 ? Math.round((item.qPassed / item.qInspected) * 100) : 0;
            
            return (
              <div key={itemId} className="bg-white/90 backdrop-blur-md rounded-xl border border-primary/10 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                {/* Summary Header (Always Visible) */}
                <div 
                  className="p-4 flex flex-col md:flex-row justify-between md:items-center gap-4 cursor-pointer hover:bg-primary/5 transition-colors"
                  onClick={() => toggleExpand(itemId)}
                >
                  <div className="flex items-center gap-4">
                    <div onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                        checked={selectedIds.includes(itemId)}
                        onChange={(e) => handleSelect(e, itemId)}
                      />
                    </div>
                    <div className="bg-gradient-to-br from-primary-container to-white p-3 rounded-xl text-center min-w-[75px] shadow-sm border border-primary/20">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{dateStr.split('/')[1]}/{dateStr.split('/')[2] || ''}</p>
                      <p className="text-2xl font-black text-primary leading-none mt-1">{dateStr.split('/')[0]}</p>
                    </div>
                    <div>
                      <p className="text-label-caps text-on-surface-variant">ITEM</p>
                      <p className="font-bold text-on-surface text-lg">{item.itemNo}</p>
                      <p className="text-body-sm text-on-surface-variant font-medium text-primary">{item.itemName || '-'}</p>
                      <p className="text-body-sm text-on-surface-variant">{item.supplier}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase">Inspected</p>
                      <p className="font-bold text-on-surface text-lg">{item.qInspected}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase">Pass Rate</p>
                      <p className={`font-bold text-lg ${acceptanceRate >= 90 ? 'text-[#166534]' : 'text-error'}`}>
                        {acceptanceRate}%
                      </p>
                    </div>
                    <button className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-low focus:outline-none">
                      <span className={`material-symbols-outlined transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </button>
                  </div>
                </div>

                {/* Expanded Details Section */}
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden">
                    <div className="p-4 border-t border-outline-variant/30 bg-surface-container-lowest flex flex-col md:flex-row gap-6">
                      
                      {/* Left: Stats & Notes */}
                      <div className="flex-1 space-y-4">
                        <div className="flex gap-4">
                          <div className="flex-1 bg-[#f0fdf4] border border-[#16a34a]/20 p-3 rounded-lg text-center shadow-sm">
                            <p className="text-[10px] font-bold text-[#166534] uppercase">Passed</p>
                            <p className="font-black text-[#166534] text-xl">{item.qPassed}</p>
                          </div>
                          <div className="flex-1 bg-error-container/30 border border-error/20 p-3 rounded-lg text-center shadow-sm">
                            <p className="text-[10px] font-bold text-error uppercase">Rejected</p>
                            <p className="font-black text-error text-xl">{item.qRejected}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-label-caps text-on-surface-variant mb-1">DEFECT CATEGORY</p>
                          <p className="text-body-md font-medium text-on-surface">
                            {item.qRejected > 0 ? (item.defectCategory || 'Tidak disebutkan') : '-'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-label-caps text-on-surface-variant mb-1">NOTES</p>
                          <p className="text-body-sm text-on-surface bg-surface-container-low p-3 rounded-lg border border-outline-variant/30">
                            {item.notes || 'Tidak ada catatan.'}
                          </p>
                        </div>
                      </div>

                      {/* Right: Photos & Actions */}
                      <div className="md:w-[250px] flex flex-col gap-4">
                        <div>
                          <p className="text-label-caps text-on-surface-variant mb-2">EVIDENCE PHOTOS</p>
                          {item.photos && item.photos.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {item.photos.map((photo, index) => (
                                <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-outline-variant shadow-sm group">
                                  <img 
                                    src={photo} 
                                    alt={`Evidence ${index + 1}`} 
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                  />
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setSelectedPhoto(photo); }}
                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer w-full h-full"
                                  >
                                    <span className="material-symbols-outlined text-white">zoom_in</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-body-sm text-on-surface-variant italic">Tidak ada foto</p>
                          )}
                        </div>

                        <div className="mt-auto pt-4 border-t border-outline-variant/30">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleShare(item); }}
                            className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#20b858] transition-colors shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[18px]">share</span>
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
