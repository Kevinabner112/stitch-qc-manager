import React, { useState, useMemo } from 'react';
import { useInspectionStore } from '../store/useInspectionStore';
import MasterDataModal from '../components/MasterDataModal';
import * as XLSX from 'xlsx';
const MasterData = () => {
  const { 
    masterSuppliers, masterItems, masterDefects,
    deleteSupplier, deleteItem, deleteDefect
  } = useInspectionStore();
  const [activeTab, setActiveTab] = useState('Suppliers');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Collect unique suggestions based on active tab
  const searchSuggestions = useMemo(() => {
    const suggestions = new Set();
    if (activeTab === 'Suppliers') {
      masterSuppliers.forEach(s => { suggestions.add(s.name); suggestions.add(s.id); });
    } else if (activeTab === 'Items') {
      masterItems.forEach(i => { suggestions.add(i.name); suggestions.add(i.id); suggestions.add(i.category); });
    } else if (activeTab === 'Defects') {
      masterDefects.forEach(d => { suggestions.add(d.name); suggestions.add(d.code); suggestions.add(d.severity); });
    }
    return Array.from(suggestions).filter(Boolean).sort();
  }, [masterSuppliers, masterItems, masterDefects, activeTab]);

  // Filtering logic
  const getFilteredData = () => {
    const term = searchTerm.toLowerCase();
    switch(activeTab) {
      case 'Suppliers':
        return masterSuppliers.filter(s => 
          (s.name || '').toLowerCase().includes(term) || 
          (s.id || '').toLowerCase().includes(term) ||
          (s.contact || '').toLowerCase().includes(term) ||
          (s.status || '').toLowerCase().includes(term)
        );
      case 'Items':
        return masterItems.filter(i => 
          (i.name || '').toLowerCase().includes(term) || 
          (i.id || '').toLowerCase().includes(term) || 
          (i.category || '').toLowerCase().includes(term) ||
          (i.defaultSupplier || '').toLowerCase().includes(term) ||
          (i.status || '').toLowerCase().includes(term)
        );
      case 'Defects':
        return masterDefects.filter(d => 
          (d.name || '').toLowerCase().includes(term) || 
          (d.code || '').toLowerCase().includes(term) ||
          (d.severity || '').toLowerCase().includes(term) ||
          (d.description || '').toLowerCase().includes(term) ||
          (d.status || '').toLowerCase().includes(term)
        );
      default:
        return [];
    }
  };

  const filteredData = getFilteredData();

  const handleAdd = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleDelete = (idOrCode) => {
    if (window.confirm('Are you sure you want to delete this record? This cannot be undone.')) {
      if (activeTab === 'Suppliers') deleteSupplier(idOrCode);
      else if (activeTab === 'Items') deleteItem(idOrCode);
      else if (activeTab === 'Defects') deleteDefect(idOrCode);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        if (jsonData.length === 0) {
          alert("File Excel kosong atau format tidak sesuai.");
          return;
        }

        let count = 0;
        for (const row of jsonData) {
          const hasItemFields = row['Nama Item'] || row['nama item'] || row['No Item'] || row['no item'] || row['Default Supplier'] || row['default supplier'];
          const hasDefectFields = row['Severity'] || row['severity'] || row['Defect Name'] || row['defect name'];

          if (hasItemFields || (activeTab === 'Items' && !row['Contact Information'] && !row['contact'])) {
             const itemName = row['Nama Item'] || row['nama item'] || row.name || row.Item;
             const itemNo = row['No Item'] || row['no item'] || row.id || row['Item No'];
             const defSupplier = row['Default Supplier'] || row['default supplier'] || row.defaultSupplier || row.Supplier || row.supplier || '';
             
             if (itemName || itemNo) { 
               await useInspectionStore.getState().addItem({ 
                 id: itemNo ? String(itemNo) : `ITM-${Date.now()}`,
                 name: itemName ? String(itemName) : String(itemNo), 
                 category: String(row.category || row.Category || 'General'), 
                 defaultSupplier: String(defSupplier || ''), 
                 status: String(row.status || row.Status || 'Active') 
               }); 
               count++; 
             }
          } else if (hasDefectFields || activeTab === 'Defects') {
             const defName = row['Defect Name'] || row['defect name'] || row.name;
             if (defName) { 
               await useInspectionStore.getState().addDefect({ 
                 name: String(defName), 
                 severity: String(row.severity || row.Severity || 'Minor'), 
                 description: String(row.description || row.Description || ''), 
                 status: String(row.status || row.Status || 'Active') 
               }); 
               count++; 
             }
          } else {
             const supName = row['Supplier Name'] || row['supplier name'] || row['Supplier'] || row.supplier || row.name;
             const contactInfo = row['Contact Information'] || row['contact information'] || row.contact || row.Contact || '';
             
             if (supName) { 
               await useInspectionStore.getState().addSupplier({ 
                 name: String(supName), 
                 contact: String(contactInfo), 
                 status: String(row.status || row.Status || 'Active') 
               }); 
               count++; 
             }
          }
        }
        alert(`Berhasil meng-import ${count} data ke tab ${activeTab}!`);
      } catch (error) {
        console.error(error);
        alert("Gagal membaca file Excel. Pastikan formatnya benar.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  const renderStatus = (status) => {
    if (status === 'Active') {
      return <span className="inline-flex items-center px-2 py-1 rounded-sm bg-[#166534]/10 text-[#166534] text-[10px] font-bold uppercase tracking-wider">Active</span>;
    }
    if (status === 'Inactive') {
      return <span className="inline-flex items-center px-2 py-1 rounded-sm bg-outline-variant/30 text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Inactive</span>;
    }
    return <span className="inline-flex items-center px-2 py-1 rounded-sm bg-[#991b1b]/10 text-[#991b1b] text-[10px] font-bold uppercase tracking-wider">{status}</span>;
  };
  
  const renderSeverity = (severity) => {
    if (severity === 'Critical') return <span className="text-error font-bold text-sm">Critical</span>;
    if (severity === 'Major') return <span className="text-amber-600 font-bold text-sm">Major</span>;
    return <span className="text-primary font-bold text-sm">Minor</span>;
  }

  const renderTableHeaders = () => {
    const thClass = "px-1 sm:px-md py-2 sm:py-3 text-[9px] sm:text-label-caps text-on-surface-variant uppercase tracking-wider leading-tight";
    if (activeTab === 'Suppliers') {
      return (
        <tr className="bg-surface-container-low border-b border-outline-variant">
          <th className={thClass}>Supplier Name</th>
          <th className={thClass}>Contact</th>
          <th className={thClass}>Status</th>
          <th className={`${thClass} text-right`}>Actions</th>
        </tr>
      );
    } else if (activeTab === 'Items') {
      return (
        <tr className="bg-surface-container-low border-b border-outline-variant">
          <th className={thClass}>Nama Item</th>
          <th className={thClass}>Category</th>
          <th className={thClass}>Default Supplier</th>
          <th className={thClass}>Status</th>
          <th className={`${thClass} text-right`}>Actions</th>
        </tr>
      );
    } else if (activeTab === 'Defects') {
      return (
        <tr className="bg-surface-container-low border-b border-outline-variant">
          <th className={thClass}>Defect Name</th>
          <th className={thClass}>Severity</th>
          <th className={`${thClass} hidden md:table-cell`}>Description</th>
          <th className={thClass}>Status</th>
          <th className={`${thClass} text-right`}>Actions</th>
        </tr>
      );
    }
  };

  const renderTableBody = () => {
    const tdClass = "px-1 sm:px-md py-2 sm:py-3 text-xs sm:text-sm";
    if (filteredData.length === 0) {
      return (
        <tr>
          <td colSpan="5" className={`${tdClass} text-center text-on-surface-variant`}>
            No records found matching "{searchTerm}".
          </td>
        </tr>
      );
    }

    if (activeTab === 'Suppliers') {
      return filteredData.map(sup => (
        <tr key={sup.id} className="hover:bg-surface-container/30 transition-colors">
          <td className={`${tdClass} font-medium text-on-surface`}>{sup.name}</td>
          <td className={`${tdClass} text-on-surface-variant`}>{sup.contact}</td>
          <td className={tdClass}>{renderStatus(sup.status)}</td>
          <td className={tdClass}>
            <div className="flex justify-end gap-1 sm:gap-sm">
              <button onClick={() => handleEdit(sup)} className="p-1 text-secondary hover:text-primary transition-colors"><span className="material-symbols-outlined text-[16px] sm:text-[20px]">edit</span></button>
              <button onClick={() => handleDelete(sup.firebaseId || sup.id)} className="p-1 text-secondary hover:text-error transition-colors"><span className="material-symbols-outlined text-[16px] sm:text-[20px]">delete</span></button>
            </div>
          </td>
        </tr>
      ));
    } else if (activeTab === 'Items') {
      return filteredData.map(itm => (
        <tr key={itm.firebaseId || `${itm.id}_${itm.name}`} className="hover:bg-surface-container/30 transition-colors">
          <td className={tdClass}>
            <div className="font-medium text-on-surface">{itm.name}</div>
            <div className="text-xs text-on-surface-variant font-data-mono">{itm.id}</div>
          </td>
          <td className={`${tdClass} text-on-surface-variant`}>{itm.category}</td>
          <td className={`${tdClass} text-on-surface-variant`}>{itm.defaultSupplier}</td>
          <td className={tdClass}>{renderStatus(itm.status)}</td>
          <td className={tdClass}>
            <div className="flex justify-end gap-1 sm:gap-sm">
              <button onClick={() => handleEdit(itm)} className="p-1 text-secondary hover:text-primary transition-colors"><span className="material-symbols-outlined text-[16px] sm:text-[20px]">edit</span></button>
              <button onClick={() => handleDelete(itm.firebaseId || itm.id)} className="p-1 text-secondary hover:text-error transition-colors"><span className="material-symbols-outlined text-[16px] sm:text-[20px]">delete</span></button>
            </div>
          </td>
        </tr>
      ));
    } else if (activeTab === 'Defects') {
      return filteredData.map(def => (
        <tr key={def.code} className="hover:bg-surface-container/30 transition-colors">
          <td className={`${tdClass} font-medium text-on-surface`}>{def.name}</td>
          <td className={tdClass}>{renderSeverity(def.severity)}</td>
          <td className={`${tdClass} text-on-surface-variant max-w-[150px] truncate hidden md:table-cell`} title={def.description}>{def.description}</td>
          <td className={tdClass}>{renderStatus(def.status)}</td>
          <td className={tdClass}>
            <div className="flex justify-end gap-1 sm:gap-sm">
              <button onClick={() => handleEdit(def)} className="p-1 text-secondary hover:text-primary transition-colors"><span className="material-symbols-outlined text-[16px] sm:text-[20px]">edit</span></button>
              <button onClick={() => handleDelete(def.firebaseId || def.code)} className="p-1 text-secondary hover:text-error transition-colors"><span className="material-symbols-outlined text-[16px] sm:text-[20px]">delete</span></button>
            </div>
          </td>
        </tr>
      ));
    }
  };

  const getTabClass = (tabName) => {
    if (activeTab === tabName) {
      return "flex-1 md:flex-none px-md py-2 rounded-md bg-surface-container-lowest shadow-sm text-primary font-data-mono font-medium transition-all";
    }
    return "flex-1 md:flex-none px-md py-2 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50 font-data-mono transition-all";
  };

  return (
    <div className="p-lg flex flex-col gap-lg max-w-[1440px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-sm">
        <div>
          <h1 className="text-headline-lg-mobile md:text-headline-lg font-bold text-on-surface">Master Data</h1>
          <p className="text-body-md text-on-surface-variant mt-xs">Manage system reference records</p>
        </div>
        
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-sm">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input 
              type="text" 
              list="master-search-suggestions"
              placeholder="Search records..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-sm py-2 bg-surface-container-lowest border border-outline-variant rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-body-md placeholder-outline"
            />
            <datalist id="master-search-suggestions">
              {searchSuggestions.map((suggestion, idx) => (
                <option key={idx} value={suggestion} />
              ))}
            </datalist>
          </div>
          
          {/* Seed Database (Only if empty) */}
          {masterSuppliers.length === 0 && (
            <button onClick={() => useInspectionStore.getState().seedDatabase()} className="flex items-center justify-center gap-xs bg-outline-variant/30 text-on-surface-variant py-2 px-md rounded-md font-label-caps tracking-wider hover:bg-outline-variant transition-colors whitespace-nowrap">
              <span className="material-symbols-outlined text-[18px]">database</span>
              SEED DATA
            </button>
          )}

          {/* Import Excel */}
          <label className="flex items-center justify-center gap-xs bg-surface-container-high text-on-surface py-2 px-md rounded-md font-label-caps tracking-wider hover:bg-outline-variant/50 transition-colors whitespace-nowrap cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            IMPORT EXCEL
            <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleImport} />
          </label>

          {/* Action Button */}
          <button onClick={handleAdd} className="flex items-center justify-center gap-xs bg-primary-container text-white py-2 px-md rounded-md font-label-caps tracking-wider hover:bg-on-primary-fixed-variant transition-colors whitespace-nowrap">
            <span className="material-symbols-outlined text-[18px]">add</span>
            ADD NEW {activeTab.toUpperCase().replace(/S$/, '')}
          </button>
        </div>
      </div>

      {/* Segmented Tabs */}
      <div className="flex flex-col sm:flex-row bg-surface-container-low p-xs rounded-lg w-full md:w-fit shadow-sm border border-outline-variant/30 gap-1">
        <button 
          onClick={() => setActiveTab('Suppliers')} 
          className={getTabClass('Suppliers')}
        >
          Master Suppliers
        </button>
        <button 
          onClick={() => setActiveTab('Items')}
          className={getTabClass('Items')}
        >
          Master Items
        </button>
        <button 
          onClick={() => setActiveTab('Defects')}
          className={getTabClass('Defects')}
        >
          Defect Categories
        </button>
      </div>

      {/* Data Grid / List */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {renderTableHeaders()}
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {renderTableBody()}
            </tbody>
          </table>
        </div>
        
        {/* Pagination / Footer */}
        <div className="px-md py-3 border-t border-outline-variant flex items-center justify-between bg-surface-container-lowest">
          <span className="text-data-mono text-on-surface-variant text-[12px]">Showing 1 to {filteredData.length} of {filteredData.length} entries</span>
          <div className="flex gap-sm">
            <button className="px-3 py-1 border border-outline-variant rounded-md text-on-surface-variant hover:bg-surface-container-low transition-colors text-label-caps uppercase disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 border border-outline-variant rounded-md text-on-surface-variant hover:bg-surface-container-low transition-colors text-label-caps uppercase disabled:opacity-50" disabled={filteredData.length <= 10}>Next</button>
          </div>
        </div>
      </div>
      
      <MasterDataModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeTab={activeTab}
        initialData={editingRecord}
      />
    </div>
  );
};

export default MasterData;
