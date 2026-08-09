import React, { useState, useEffect } from 'react';
import { useInspectionStore } from '../store/useInspectionStore';

const MasterDataModal = ({ isOpen, onClose, activeTab, initialData = null }) => {
  const { 
    addSupplier, updateSupplier, 
    addItem, updateItem, 
    addDefect, updateDefect,
    masterSuppliers
  } = useInspectionStore();

  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({ ...initialData });
      } else {
        // Initialize empty form based on activeTab
        if (activeTab === 'Suppliers') {
          setFormData({ name: '', contact: '', status: 'Active' });
        } else if (activeTab === 'Items') {
          setFormData({ id: '', name: '', category: '', defaultSupplier: '', status: 'Active' });
        } else if (activeTab === 'Defects') {
          setFormData({ name: '', description: '', severity: 'Minor', status: 'Active' });
        }
      }
    }
  }, [isOpen, initialData, activeTab]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'Suppliers') {
      if (initialData) updateSupplier(formData);
      else addSupplier(formData);
    } else if (activeTab === 'Items') {
      if (initialData) updateItem(formData);
      else addItem(formData);
    } else if (activeTab === 'Defects') {
      if (initialData) updateDefect(formData);
      else addDefect(formData);
    }
    onClose();
  };

  if (!isOpen) return null;

  const isEditing = !!initialData;

  const renderFormFields = () => {
    if (activeTab === 'Suppliers') {
      return (
        <>
          <div className="mb-4">
            <label className="block text-body-md font-medium text-on-surface mb-xs">Supplier Name *</label>
            <input required type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full rounded-md border border-outline-variant px-3 py-2 bg-surface-container-lowest" />
          </div>
          <div className="mb-4">
            <label className="block text-body-md font-medium text-on-surface mb-xs">Contact Information *</label>
            <input required type="text" name="contact" value={formData.contact || ''} onChange={handleChange} className="w-full rounded-md border border-outline-variant px-3 py-2 bg-surface-container-lowest" />
          </div>
        </>
      );
    } else if (activeTab === 'Items') {
      return (
        <>
          <div className="mb-4">
            <label className="block text-body-md font-medium text-on-surface mb-xs">Item No. *</label>
            <input required type="text" name="id" value={formData.id || ''} onChange={handleChange} className="w-full rounded-md border border-outline-variant px-3 py-2 bg-surface-container-lowest" disabled={isEditing} />
          </div>
          <div className="mb-4">
            <label className="block text-body-md font-medium text-on-surface mb-xs">Item Name *</label>
            <input required type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full rounded-md border border-outline-variant px-3 py-2 bg-surface-container-lowest" />
          </div>
          <div className="mb-4">
            <label className="block text-body-md font-medium text-on-surface mb-xs">Category *</label>
            <input required type="text" name="category" value={formData.category || ''} onChange={handleChange} className="w-full rounded-md border border-outline-variant px-3 py-2 bg-surface-container-lowest" />
          </div>
          <div className="mb-4">
            <label className="block text-body-md font-medium text-on-surface mb-xs">Default Supplier *</label>
            <select required name="defaultSupplier" value={formData.defaultSupplier || ''} onChange={handleChange} className="w-full rounded-md border border-outline-variant px-3 py-2 bg-surface-container-lowest">
              <option value="">Select a supplier</option>
              {masterSuppliers.filter(s => s.status === 'Active').map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
        </>
      );
    } else if (activeTab === 'Defects') {
      return (
        <>
          <div className="mb-4">
            <label className="block text-body-md font-medium text-on-surface mb-xs">Defect Name *</label>
            <input required type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full rounded-md border border-outline-variant px-3 py-2 bg-surface-container-lowest" />
          </div>
          <div className="mb-4">
            <label className="block text-body-md font-medium text-on-surface mb-xs">Description</label>
            <textarea name="description" value={formData.description || ''} onChange={handleChange} className="w-full rounded-md border border-outline-variant px-3 py-2 bg-surface-container-lowest" rows="2" />
          </div>
          <div className="mb-4">
            <label className="block text-body-md font-medium text-on-surface mb-xs">Severity *</label>
            <select required name="severity" value={formData.severity || 'Minor'} onChange={handleChange} className="w-full rounded-md border border-outline-variant px-3 py-2 bg-surface-container-lowest">
              <option value="Minor">Minor</option>
              <option value="Major">Major</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface-container-lowest rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-md border-b border-outline-variant/30 flex justify-between items-center sticky top-0 bg-surface-container-lowest">
          <h2 className="text-headline-sm text-on-surface font-bold">
            {isEditing ? 'Edit' : 'Add'} {activeTab.slice(0, -1)}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-md">
          {renderFormFields()}
          
          <div className="mb-6">
            <label className="block text-body-md font-medium text-on-surface mb-xs">Status *</label>
            <select name="status" value={formData.status || 'Active'} onChange={handleChange} className="w-full rounded-md border border-outline-variant px-3 py-2 bg-surface-container-lowest">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              {activeTab === 'Suppliers' && <option value="Suspended">Suspended</option>}
              {activeTab === 'Items' && <option value="Suspended">Suspended</option>}
            </select>
          </div>
          
          <div className="flex justify-end gap-sm pt-4 border-t border-outline-variant/30">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-on-surface-variant font-medium hover:bg-surface-container-low transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-md bg-primary text-on-primary font-medium hover:bg-primary/90 transition-colors">
              {isEditing ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MasterDataModal;
