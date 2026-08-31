import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInspectionStore } from '../store/useInspectionStore';
import { validateInspection } from '../utils/validationRules';
import { getStatusText } from '../utils/grading';
import ValidationBanner from '../components/InspectionForm/ValidationBanner';
import PhotoUploader from '../components/InspectionForm/PhotoUploader';

const initialItemState = () => ({
  id: Date.now() + Math.random(),
  selectedItemKey: '',
  qtyReceived: 0,
  uom: 'Pcs',
  qInspected: '',
  qPassed: '',
  qRejected: '',
  defectCategory: '',
  notes: '',
  photos: []
});

const NewInspection = () => {
  const navigate = useNavigate();
  const { addInspection, masterSuppliers, masterItems, masterDefects, addSupplier, addItem, addDefect } = useInspectionStore();

  const [supplier, setSupplier] = useState('');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [itemsList, setItemsList] = useState([initialItemState()]);

  // Modal states
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierContact, setNewSupplierContact] = useState('');
  
  const [newItemForIndex, setNewItemForIndex] = useState(null);
  const [newItemId, setNewItemId] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  
  const [newDefectForIndex, setNewDefectForIndex] = useState(null);
  const [newDefectName, setNewDefectName] = useState('');
  const [newDefectDescription, setNewDefectDescription] = useState('');
  const [newDefectSeverity, setNewDefectSeverity] = useState('Minor');

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    if (masterSuppliers.length > 0 && !supplier) {
      setSupplier(masterSuppliers[0].name);
    }
  }, [masterSuppliers, supplier]);

  const getItemKey = (item) => item.firebaseId || `${item.id}::${item.name}`;

  const rawActiveItems = masterItems.filter(item => !item.defaultSupplier || item.defaultSupplier === supplier || supplier === '');

  const activeItems = useMemo(() => {
    const seen = new Set();
    const result = [];
    rawActiveItems.forEach(item => {
      const comboKey = `${item.id}::${item.name}`.trim().toLowerCase();
      if (!seen.has(comboKey)) {
        seen.add(comboKey);
        result.push(item);
      }
    });
    return result.sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true, sensitivity: 'base' }));
  }, [rawActiveItems]);

  const updateItem = (index, field, value) => {
    const newItems = [...itemsList];
    newItems[index][field] = value;
    setItemsList(newItems);
  };

  const removeItem = (index) => {
    if (itemsList.length > 1) {
      const newItems = [...itemsList];
      newItems.splice(index, 1);
      setItemsList(newItems);
    }
  };

  const addNewItemCard = () => {
    setItemsList([...itemsList, initialItemState()]);
  };

  const handleSupplierChange = (e) => {
    if (e.target.value === '__NEW__') setShowNewSupplier(true);
    else setSupplier(e.target.value);
  };
  
  const handleItemChange = (index, e) => {
    if (e.target.value === '__NEW__') setNewItemForIndex(index);
    else updateItem(index, 'selectedItemKey', e.target.value);
  };
  
  const handleDefectChange = (index, e) => {
    if (e.target.value === '__NEW__') setNewDefectForIndex(index);
    else updateItem(index, 'defectCategory', e.target.value);
  };

  const handleCreateSupplier = async () => {
    if (newSupplierName.trim()) {
      await addSupplier({ 
        name: newSupplierName.trim(), 
        contact: newSupplierContact.trim(),
        status: 'Active' 
      });
      setSupplier(newSupplierName.trim());
      setShowNewSupplier(false);
      setNewSupplierName('');
      setNewSupplierContact('');
    }
  };

  const handleCreateItem = async () => {
    if (newItemName.trim() && newItemId.trim() && supplier) {
      const newId = newItemId.trim();
      const newName = newItemName.trim();
      await addItem({ 
        id: newId, 
        name: newName, 
        category: newItemCategory.trim(),
        defaultSupplier: supplier, 
        status: 'Active' 
      });
      if (newItemForIndex !== null) {
        updateItem(newItemForIndex, 'selectedItemKey', `${newId}::${newName}`);
      }
      setNewItemForIndex(null);
      setNewItemId('');
      setNewItemName('');
      setNewItemCategory('');
    }
  };

  const handleCreateDefect = async () => {
    if (newDefectName.trim()) {
      await addDefect({ 
        name: newDefectName.trim(), 
        severity: newDefectSeverity, 
        description: newDefectDescription.trim(),
        status: 'Active' 
      });
      if (newDefectForIndex !== null) {
        updateItem(newDefectForIndex, 'defectCategory', newDefectName.trim());
      }
      setNewDefectForIndex(null);
      setNewDefectName('');
      setNewDefectSeverity('Minor');
      setNewDefectDescription('');
    }
  };

  // Determine if all items are valid
  const validatedItems = itemsList.map(item => {
    const val = validateInspection(item.qInspected, item.qPassed, item.qRejected, item.defectCategory);
    return { ...item, validation: val };
  });
  const isAllValid = validatedItems.every(i => i.validation.isValid) && supplier && inspectionDate;

  const handleSubmit = async () => {
    if (isAllValid) {
      let hasLowAcceptance = false;

      for (const item of validatedItems) {
        const selectedItem = activeItems.find(i => getItemKey(i) === item.selectedItemKey) || null;
        
        const acceptanceRate = item.validation.qInspected > 0 
          ? Math.round((item.validation.qPassed / item.validation.qInspected) * 100) 
          : 0;
          
        if (acceptanceRate < 90 && item.validation.qInspected > 0) {
          hasLowAcceptance = true;
        }

        await addInspection({
          date: inspectionDate,
          supplier,
          itemNo: selectedItem ? selectedItem.id : '',
          itemName: selectedItem ? selectedItem.name : '',
          qtyReceived: item.qtyReceived,
          uom: item.uom,
          qInspected: item.validation.qInspected,
          qPassed: item.validation.qPassed,
          qRejected: item.validation.qRejected,
          defectCategory: item.defectCategory,
          notes: item.notes,
          photos: item.photos,
          acceptanceRate
        });
      }
      
      if (hasLowAcceptance) {
        setWarningMessage('Perhatian: Terdapat item dengan Acceptance Rate di bawah standar (<90%). Mohon evaluasi supplier ini.');
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
      }
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/history');
      }, hasLowAcceptance ? 3000 : 2000);
    }
  };

  return (
    <div className="flex flex-col gap-lg max-w-[1440px] mx-auto relative pb-24">
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-[#16a34a] text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="font-medium">Inspections submitted successfully!</span>
        </div>
      )}
      
      {showWarning && (
        <div className="fixed top-20 right-4 z-50 bg-[#ef4444] text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4 max-w-sm">
          <span className="material-symbols-outlined">warning</span>
          <span className="font-medium text-sm">{warningMessage}</span>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-md flex flex-wrap justify-between items-center gap-md shadow-sm">
        <div>
          <p className="text-label-caps text-on-surface-variant mb-xs">NEW INSPECTION</p>
          <p className="text-data-mono font-semibold text-on-surface">{itemsList.length} Item(s)</p>
        </div>
      </div>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-md shadow-sm">
        <h2 className="text-headline-md text-on-surface mb-md text-center">Masukkan Inspeksi Baru</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label className="block text-body-md font-medium text-on-surface mb-xs">Tanggal Inspeksi</label>
            <input 
              type="date" 
              value={inspectionDate}
              onChange={e => setInspectionDate(e.target.value)}
              className="w-full rounded-md border border-outline-variant px-3 py-2 bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-body-md font-medium text-on-surface mb-xs">Supplier</label>
            <select 
              value={supplier} 
              onChange={handleSupplierChange}
              className="w-full rounded-md border border-outline-variant px-3 py-2 bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              {Array.from(new Set(masterSuppliers.filter(s => s.status === 'Active').map(s => s.name)))
                .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }))
                .map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
              <option value="__NEW__" className="font-bold text-primary">+ Buat Baru...</option>
            </select>
          </div>
        </div>
      </section>

      {/* ITEMS LOOP */}
      {validatedItems.map((item, index) => {
        const acceptanceRate = item.validation.qInspected > 0 
          ? Math.round((item.validation.qPassed / item.validation.qInspected) * 100) : 0;
        const rejectRate = 100 - acceptanceRate;

        return (
          <div key={item.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm flex flex-col">
            <div className="bg-surface-container-low p-3 border-b border-outline-variant/50 flex justify-between items-center">
              <h3 className="font-bold text-primary">Item {index + 1}</h3>
              {itemsList.length > 1 && (
                <button 
                  onClick={() => removeItem(index)}
                  className="text-error hover:bg-error/10 p-1.5 rounded-full flex items-center justify-center transition-colors"
                  title="Hapus Item Ini"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              )}
            </div>
            
            <div className="p-md flex flex-col gap-lg">
              {/* Item Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                <div className="lg:col-span-1">
                  <label className="block text-body-md font-medium text-on-surface mb-xs">Item No.</label>
                  <select 
                    value={item.selectedItemKey} 
                    onChange={e => handleItemChange(index, e)}
                    className="w-full rounded-md border border-outline-variant px-3 py-2 bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
                  >
                    <option value="">Select Item...</option>
                    {activeItems.filter(i => i.status === 'Active').map(actItem => (
                      <option key={getItemKey(actItem)} value={getItemKey(actItem)}>
                        {actItem.id} - {actItem.name}
                      </option>
                    ))}
                    {supplier && <option value="__NEW__" className="font-bold text-primary">+ Buat Baru...</option>}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:col-span-2">
                  <div>
                    <label className="block text-body-md font-medium text-on-surface mb-xs">QTY Received</label>
                    <input 
                      type="number" 
                      value={item.qtyReceived} 
                      onChange={e => updateItem(index, 'qtyReceived', e.target.value)}
                      className="w-full rounded-md border border-outline-variant px-3 py-2 bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-body-md font-medium text-on-surface mb-xs">UoM</label>
                    <select 
                      value={item.uom}
                      onChange={e => updateItem(index, 'uom', e.target.value)}
                      className="w-full rounded-md border border-outline-variant px-3 py-2 bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    >
                      <option value="Pcs">Pcs</option>
                      <option value="Kg">Kg</option>
                      <option value="Meter">Meter</option>
                      <option value="Roll">Roll</option>
                      <option value="Set">Set</option>
                      <option value="Karton">Karton</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Inspection Quantities */}
              <div>
                <h4 className="text-label-caps text-on-surface-variant mb-sm">INSPECTION QUANTITIES</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                  <div>
                    <label className="block text-body-md font-medium text-on-surface mb-xs">QTY Inspected</label>
                    <input 
                      type="number" 
                      value={item.qInspected} 
                      onChange={e => updateItem(index, 'qInspected', e.target.value)}
                      className="w-full rounded-md border border-outline-variant text-center text-lg font-semibold bg-surface-container-low px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-body-md font-medium text-[#16a34a] mb-xs">QTY Passed</label>
                    <input 
                      type="number" 
                      value={item.qPassed} 
                      onChange={e => updateItem(index, 'qPassed', e.target.value)}
                      className="w-full rounded-md border border-[#16a34a]/30 text-center text-lg font-semibold bg-[#f0fdf4] text-[#16a34a] px-3 py-2 focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-body-md font-medium text-error mb-xs">QTY Rejected</label>
                    <input 
                      type="number" 
                      value={item.qRejected} 
                      onChange={e => updateItem(index, 'qRejected', e.target.value)}
                      className="w-full rounded-md border border-error/30 text-center text-lg font-semibold bg-error-container text-on-error-container px-3 py-2 focus:border-error focus:ring-1 focus:ring-error outline-none" 
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <ValidationBanner validation={item.validation} />
                </div>
              </div>

              {/* Defects */}
              {item.validation.qRejected > 0 && (
                <div className="bg-error-container/10 p-4 rounded-lg border border-error/20">
                  <div className="flex justify-between items-center mb-md">
                    <h4 className="text-label-caps text-on-surface-variant">DEFECTS</h4>
                    <span className="bg-[#fef3c7] text-[#92400e] text-label-caps px-2 py-1 rounded-full font-bold">
                      {item.validation.qRejected} REJECTED
                    </span>
                  </div>
                  <div>
                    <label className="block text-body-md font-medium text-on-surface mb-xs">Defect Category *</label>
                    <select 
                      value={item.defectCategory}
                      onChange={e => handleDefectChange(index, e)}
                      className={`w-full md:w-1/2 rounded-md border ${!item.validation.defectValid ? 'border-error' : 'border-outline-variant'} px-3 py-2 bg-white focus:outline-none focus:ring-1`}
                    >
                      <option value="">Select a category</option>
                      {masterDefects.filter(d => d.status === 'Active').map(def => (
                        <option key={def.code} value={def.name}>{def.name} ({def.severity})</option>
                      ))}
                      <option value="__NEW__" className="font-bold text-primary">+ Buat Baru...</option>
                    </select>
                    {!item.validation.defectValid && (
                      <p className="text-error text-body-sm mt-1">Please select a defect category.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Evidence & Notes */}
              <div>
                <h4 className="text-label-caps text-on-surface-variant mb-sm">EVIDENCE & NOTES</h4>
                <div className="mb-md">
                  <PhotoUploader photos={item.photos} setPhotos={(newPhotos) => updateItem(index, 'photos', typeof newPhotos === 'function' ? newPhotos(item.photos) : newPhotos)} />
                </div>
                <div>
                  <label className="block text-body-md font-medium text-on-surface mb-xs">Notes</label>
                  <textarea 
                    value={item.notes}
                    onChange={e => updateItem(index, 'notes', e.target.value)}
                    className="w-full rounded-md border border-outline-variant px-3 py-2 bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
                    rows="3"
                  />
                </div>
              </div>

              {/* Status Banner */}
              {item.validation.qInspected > 0 && (
                <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant flex flex-wrap items-center gap-6">
                  <div>
                    <p className="text-[10px] text-on-surface-variant mb-0.5 uppercase font-bold">ACCEPTANCE</p>
                    <p className="text-title-lg font-bold text-[#16a34a]">{acceptanceRate}%</p>
                  </div>
                  <div className="h-8 w-px bg-outline-variant"></div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant mb-0.5 uppercase font-bold">REJECT</p>
                    <p className="text-title-lg font-bold text-error">{rejectRate}%</p>
                  </div>
                  <div className="h-8 w-px bg-outline-variant"></div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant mb-0.5 uppercase font-bold">STATUS</p>
                    <span className="inline-block bg-[#fef3c7] text-[#b45309] text-[10px] px-2 py-0.5 rounded-full font-bold border border-[#fde68a]">
                      {getStatusText(acceptanceRate)}
                    </span>
                  </div>
                </div>
              )}

            </div>
          </div>
        );
      })}

      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6 mb-8">
        <button 
          onClick={addNewItemCard}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary font-bold rounded-lg hover:bg-surface-container-low transition-colors shadow-sm w-full sm:w-auto"
        >
          <span className="material-symbols-outlined">add_circle</span>
          TAMBAHKAN ITEM LAINNYA
        </button>

        {isAllValid && (
          <button 
            onClick={handleSubmit}
            className="flex items-center justify-center gap-2 px-10 py-3 bg-[#2563EB] text-white font-bold rounded-lg shadow-md hover:bg-blue-700 hover:-translate-y-0.5 transition-all w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-[20px]">save</span>
            SUBMIT
          </button>
        )}
      </div>

      {/* New Supplier Modal */}
      {showNewSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-title-lg mb-4">Buat Supplier Baru</h3>
            <div className="mb-4">
              <label className="block text-body-sm font-medium mb-1">Supplier Name *</label>
              <input type="text" value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 mb-3 focus:border-primary outline-none" autoFocus />
              <label className="block text-body-sm font-medium mb-1">Contact Information *</label>
              <input type="text" value={newSupplierContact} onChange={e => setNewSupplierContact(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 focus:border-primary outline-none" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowNewSupplier(false)} className="px-4 py-2 text-on-surface-variant font-medium">Batal</button>
              <button onClick={handleCreateSupplier} className="px-4 py-2 bg-primary text-white rounded-lg font-medium">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* New Item Modal */}
      {newItemForIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-title-lg mb-4">Buat Item Baru</h3>
            <p className="text-body-sm text-on-surface-variant mb-4">Supplier: <strong>{supplier}</strong></p>
            <div className="mb-4">
              <label className="block text-body-sm font-medium mb-1">Item No. *</label>
              <input type="text" value={newItemId} onChange={e => setNewItemId(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 mb-3 focus:border-primary outline-none" autoFocus />
              <label className="block text-body-sm font-medium mb-1">Item Name *</label>
              <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 mb-3 focus:border-primary outline-none" />
              <label className="block text-body-sm font-medium mb-1">Category *</label>
              <input type="text" value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 focus:border-primary outline-none" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setNewItemForIndex(null)} className="px-4 py-2 text-on-surface-variant font-medium">Batal</button>
              <button onClick={handleCreateItem} className="px-4 py-2 bg-primary text-white rounded-lg font-medium">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* New Defect Modal */}
      {newDefectForIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-title-lg mb-4">Buat Kategori Defect Baru</h3>
            <div className="mb-4">
              <label className="block text-body-sm font-medium mb-1">Defect Name *</label>
              <input type="text" value={newDefectName} onChange={e => setNewDefectName(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 mb-3 focus:border-primary outline-none" autoFocus />
              <label className="block text-body-sm font-medium mb-1">Description</label>
              <input type="text" value={newDefectDescription} onChange={e => setNewDefectDescription(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 mb-3 focus:border-primary outline-none" />
              <label className="block text-body-sm font-medium mb-1">Severity *</label>
              <select value={newDefectSeverity} onChange={e => setNewDefectSeverity(e.target.value)} className="w-full rounded-md border border-outline-variant px-3 py-2 focus:border-primary outline-none">
                <option value="Minor">Minor</option>
                <option value="Major">Major</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setNewDefectForIndex(null)} className="px-4 py-2 text-on-surface-variant font-medium">Batal</button>
              <button onClick={handleCreateDefect} className="px-4 py-2 bg-primary text-white rounded-lg font-medium">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewInspection;
