import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInspectionStore } from '../store/useInspectionStore';
import { validateInspection } from '../utils/validationRules';
import { getStatusText } from '../utils/grading';
import ValidationBanner from '../components/InspectionForm/ValidationBanner';
import PhotoUploader from '../components/InspectionForm/PhotoUploader';

const NewInspection = () => {
  const navigate = useNavigate();
  const { addInspection, masterSuppliers, masterItems, masterDefects } = useInspectionStore();

  const [supplier, setSupplier] = useState('');
  const [itemNo, setItemNo] = useState('');
  const [qtyReceived, setQtyReceived] = useState(0);
  
  const [qInspected, setQInspected] = useState('');
  const [qPassed, setQPassed] = useState('');
  const [qRejected, setQRejected] = useState('');
  const [defectCategory, setDefectCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);

  // Set default supplier on load if available
  useEffect(() => {
    if (masterSuppliers.length > 0 && !supplier) {
      setSupplier(masterSuppliers[0].name);
    }
  }, [masterSuppliers, supplier]);

  // Derived filtered items based on selected supplier
  const activeItems = masterItems.filter(item => item.defaultSupplier === supplier || supplier === '');

  // Auto-select first item if items list changes
  useEffect(() => {
    if (activeItems.length > 0 && !activeItems.some(i => i.name === itemNo)) {
      setItemNo(activeItems[0].name);
    } else if (activeItems.length === 0) {
      setItemNo('');
    }
  }, [supplier, activeItems, itemNo]);

  const validation = validateInspection(qInspected, qPassed, qRejected, defectCategory);
  const acceptanceRate = validation.qInspected > 0 
    ? Math.round((validation.qPassed / validation.qInspected) * 100) 
    : 0;
  const rejectRate = 100 - acceptanceRate;

  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = () => {
    if (validation.isValid) {
      addInspection({
        supplier,
        itemNo,
        qtyReceived,
        qInspected: validation.qInspected,
        qPassed: validation.qPassed,
        qRejected: validation.qRejected,
        defectCategory,
        notes,
        photos,
        acceptanceRate
      });
      
      // Show success toast and reset form
      setShowSuccess(true);
      
      // Reset form
      setQtyReceived(0);
      setQInspected('');
      setQPassed('');
      setQRejected('');
      setDefectCategory('');
      setNotes('');
      setPhotos([]);
      
      // Hide toast after 3 seconds and navigate to history
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/history');
      }, 3000);
    }
  };

  return (
    <div className="flex flex-col gap-lg max-w-[1440px] mx-auto relative">
      {/* Success Toast Notification */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-[#16a34a] text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="font-medium">Inspection submitted successfully!</span>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-md flex flex-wrap justify-between items-center gap-md shadow-sm">
        <div>
          <p className="text-label-caps text-on-surface-variant mb-xs">NEW INSPECTION</p>
          <p className="text-data-mono font-semibold text-on-surface">Pending ID...</p>
        </div>
      </div>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-md shadow-sm">
        <h2 className="text-headline-md text-on-surface mb-md">Supplier & Item Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label className="block text-body-md font-medium text-on-surface mb-xs">Supplier</label>
            <select 
              value={supplier} 
              onChange={e => setSupplier(e.target.value)}
              className="w-full rounded-md border border-outline-variant focus:border-primary px-3 py-2 bg-surface-container-lowest"
            >
              {masterSuppliers.filter(s => s.status === 'Active').map(sup => (
                <option key={sup.id} value={sup.name}>{sup.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-body-md font-medium text-on-surface mb-xs">Item No.</label>
            <select 
              value={itemNo} 
              onChange={e => setItemNo(e.target.value)}
              className="w-full rounded-md border border-outline-variant px-3 py-2 bg-surface-container-lowest" 
            >
              <option value="">Select Item...</option>
              {activeItems.filter(i => i.status === 'Active').map(item => (
                <option key={item.id} value={item.name}>{item.id} - {item.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-body-md font-medium text-on-surface mb-xs">QTY Received</label>
            <input 
              type="number" 
              value={qtyReceived} 
              onChange={e => setQtyReceived(e.target.value)}
              className="w-full rounded-md border border-outline-variant px-3 py-2 bg-surface-container-lowest"
            />
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-md shadow-sm">
        <h2 className="text-headline-md text-on-surface mb-md">Inspection Quantities</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <div>
            <label className="block text-body-md font-medium text-on-surface mb-xs">QTY Inspected</label>
            <input 
              type="number" 
              value={qInspected} 
              onChange={e => setQInspected(e.target.value)}
              className="w-full rounded-md border border-outline-variant text-center text-lg font-semibold bg-surface-container-low px-3 py-2" 
            />
          </div>
          <div>
            <label className="block text-body-md font-medium text-[#16a34a] mb-xs">QTY Passed</label>
            <input 
              type="number" 
              value={qPassed} 
              onChange={e => setQPassed(e.target.value)}
              className="w-full rounded-md border border-[#16a34a]/30 text-center text-lg font-semibold bg-[#f0fdf4] text-[#16a34a] px-3 py-2" 
            />
          </div>
          <div>
            <label className="block text-body-md font-medium text-error mb-xs">QTY Rejected</label>
            <input 
              type="number" 
              value={qRejected} 
              onChange={e => setQRejected(e.target.value)}
              className="w-full rounded-md border border-error/30 text-center text-lg font-semibold bg-error-container text-on-error-container px-3 py-2" 
            />
          </div>
        </div>
        <ValidationBanner validation={validation} />
      </section>

      {validation.qRejected > 0 && (
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-md shadow-sm">
          <div className="flex justify-between items-center mb-md">
            <h2 className="text-headline-md text-on-surface">Defects</h2>
            <span className="bg-[#fef3c7] text-[#92400e] text-label-caps px-2 py-1 rounded-full font-bold">
              {validation.qRejected} REJECTED
            </span>
          </div>
          
          <div>
            <label className="block text-body-md font-medium text-on-surface mb-xs">Defect Category *</label>
            <select 
              value={defectCategory}
              onChange={e => setDefectCategory(e.target.value)}
              className={`w-full md:w-1/2 rounded-md border ${!validation.defectValid ? 'border-error' : 'border-outline-variant'} px-3 py-2 bg-surface-container-lowest`}
            >
              <option value="">Select a category</option>
              {masterDefects.filter(d => d.status === 'Active').map(def => (
                <option key={def.code} value={def.name}>{def.name} ({def.severity})</option>
              ))}
            </select>
            {!validation.defectValid && (
              <p className="text-error text-body-sm mt-1">Please select a defect category.</p>
            )}
          </div>
        </section>
      )}

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-md shadow-sm">
        <h2 className="text-headline-md text-on-surface mb-md">Evidence & Notes</h2>
        
        <PhotoUploader photos={photos} setPhotos={setPhotos} />

        <div>
          <label className="block text-body-md font-medium text-on-surface mb-xs">Notes</label>
          <textarea 
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full rounded-md border border-outline-variant px-3 py-2 bg-surface-container-lowest" 
            rows="3"
          />
        </div>
      </section>

      {validation.qInspected > 0 && (
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-md shadow-sm flex flex-col md:flex-row justify-between items-center gap-md">
          <div className="flex items-center gap-lg w-full md:w-auto">
            <div>
              <p className="text-label-caps text-on-surface-variant mb-xs">ACCEPTANCE</p>
              <p className="text-headline-md font-bold text-[#16a34a]">{acceptanceRate}%</p>
            </div>
            <div className="h-10 w-px bg-outline-variant"></div>
            <div>
              <p className="text-label-caps text-on-surface-variant mb-xs">REJECT</p>
              <p className="text-headline-md font-bold text-error">{rejectRate}%</p>
            </div>
            <div className="h-10 w-px bg-outline-variant"></div>
            <div>
              <p className="text-label-caps text-on-surface-variant mb-xs">STATUS</p>
              <span className="inline-block bg-[#fef3c7] text-[#b45309] text-label-caps px-3 py-1 rounded-full font-bold border border-[#fde68a]">
                {getStatusText(acceptanceRate)}
              </span>
            </div>
          </div>
          
          <button 
            disabled={!validation.isValid}
            onClick={handleSubmit}
            className={`w-full md:w-auto font-medium px-6 py-3 rounded-lg shadow-sm transition-colors ${
              validation.isValid ? 'bg-[#2563EB] text-white hover:bg-primary-container/90' : 'bg-surface-variant text-on-surface-variant cursor-not-allowed'
            }`}
          >
            SUBMIT INSPECTION
          </button>
        </section>
      )}
    </div>
  );
};

export default NewInspection;
