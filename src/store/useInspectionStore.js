import { create } from 'zustand';
import { db } from '../config/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';

// Keep initial mock data in case we want to seed
const initialSuppliers = [
  { id: 'SUP-001', name: 'Apex Industrial Materials', contact: 'contact@apex.example.com', status: 'Active' },
  { id: 'SUP-002', name: 'Global Tech Components', contact: 'sales@globaltech.example.com', status: 'Active' },
  { id: 'SUP-003', name: 'Nexus Fabrication', contact: 'admin@nexusfab.example.com', status: 'Inactive' },
];

const initialItems = [
  { id: 'ITM-1001', name: 'Alloy Bracket Type A', description: 'Heavy duty mounting bracket', category: 'Hardware', defaultSupplier: 'Apex Industrial Materials', status: 'Active' },
  { id: 'ITM-1002', name: 'Micro-Controller Board V2', description: 'Main logic board for assembly', category: 'Electronics', defaultSupplier: 'Global Tech Components', status: 'Active' },
];

const initialDefects = [
  { code: 'DEF-CRK', name: 'Crack/Fracture', severity: 'Critical', description: 'Structural integrity compromised by visible crack.', status: 'Active' },
  { code: 'DEF-DIM', name: 'Dimension NG', severity: 'Major', description: 'Part dimensions out of specified tolerance.', status: 'Active' },
];

export const useInspectionStore = create((set, get) => ({
  inspections: [],
  masterSuppliers: [],
  masterItems: [],
  masterDefects: [],
  isInitialized: false,

  // Start real-time sync with Firestore
  initFirebaseListeners: () => {
    if (get().isInitialized) return;

    // Listen to inspections
    onSnapshot(collection(db, 'inspections'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ firebaseId: doc.id, ...doc.data() }));
      
      // Sort by newest first globally
      data.sort((a, b) => {
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
        
        if (timeB === timeA) {
          const idA = a.firebaseId || '';
          const idB = b.firebaseId || '';
          return idB.localeCompare(idA);
        }
        return timeB - timeA;
      });
      
      set({ inspections: data });
    });

    // Listen to suppliers
    onSnapshot(collection(db, 'master_suppliers'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ firebaseId: doc.id, ...doc.data() }));
      data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      set({ masterSuppliers: data });
    });

    // Listen to items
    onSnapshot(collection(db, 'master_items'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ firebaseId: doc.id, ...doc.data() }));
      data.sort((a, b) => (a.name || a.id || '').localeCompare(b.name || b.id || ''));
      set({ masterItems: data });
    });

    // Listen to defects
    onSnapshot(collection(db, 'master_defects'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ firebaseId: doc.id, ...doc.data() }));
      data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      set({ masterDefects: data });
    });

    set({ isInitialized: true });
  },

  // Inspection Actions
  addInspection: async (inspection) => {
    try {
      const newDoc = { ...inspection, createdAt: new Date().toISOString() };
      await addDoc(collection(db, 'inspections'), newDoc);
    } catch (error) {
      console.error("Error adding inspection: ", error);
    }
  },
  
  deleteInspection: async (firebaseId) => {
    try {
      await deleteDoc(doc(db, 'inspections', firebaseId));
    } catch (error) {
      console.error("Error deleting inspection: ", error);
    }
  },
  
  updateInspection: async (firebaseId, data) => {
    try {
      await updateDoc(doc(db, 'inspections', firebaseId), data);
    } catch (error) {
      console.error("Error updating inspection: ", error);
    }
  },
  
  // Dashboard mock metrics derived from state
  getMetrics: () => {
    const state = get();
    if (state.inspections.length === 0) {
      return { totalInspections: 0, totalQtyInspected: 0, totalQtyPassed: 0, acceptanceRate: 0 };
    }

    const totalInspections = state.inspections.length;
    let totalQtyInspected = 0;
    let totalQtyPassed = 0;
    
    state.inspections.forEach(i => {
      totalQtyInspected += Number(i.qInspected) || 0;
      totalQtyPassed += Number(i.qPassed) || 0;
    });

    const acceptanceRate = totalQtyInspected > 0 
      ? Math.round((totalQtyPassed / totalQtyInspected) * 100 * 100) / 100 
      : 0;

    return { totalInspections, totalQtyInspected, totalQtyPassed, acceptanceRate };
  },
  
  // Master Data Actions
  deleteSupplier: async (idOrCode) => {
    const target = get().masterSuppliers.find(s => s.firebaseId === idOrCode || s.id === idOrCode);
    if (target?.firebaseId) await deleteDoc(doc(db, 'master_suppliers', target.firebaseId));
  },
  updateSupplier: async (updatedSupplier) => {
    const { firebaseId, ...data } = updatedSupplier;
    if (firebaseId) await updateDoc(doc(db, 'master_suppliers', firebaseId), data);
  },
  addSupplier: async (supplier) => {
    const newSupplier = { ...supplier };
    if (!newSupplier.id) {
      newSupplier.id = `SUP-${Date.now()}`;
    }
    await addDoc(collection(db, 'master_suppliers'), newSupplier);
  },
  
  deleteItem: async (idOrKey) => {
    const target = get().masterItems.find(i => i.firebaseId === idOrKey || i.id === idOrKey);
    if (target?.firebaseId) await deleteDoc(doc(db, 'master_items', target.firebaseId));
  },
  updateItem: async (updatedItem) => {
    const { firebaseId, ...data } = updatedItem;
    if (firebaseId) await updateDoc(doc(db, 'master_items', firebaseId), data);
  },
  addItem: async (item) => {
    const newItem = { ...item };
    if (!newItem.id) {
      newItem.id = `ITM-${Date.now()}`;
    }
    await addDoc(collection(db, 'master_items'), newItem);
  },
  
  deleteDefect: async (idOrKey) => {
    const target = get().masterDefects.find(d => d.firebaseId === idOrKey || d.code === idOrKey);
    if (target?.firebaseId) await deleteDoc(doc(db, 'master_defects', target.firebaseId));
  },
  updateDefect: async (updatedDefect) => {
    const { firebaseId, ...data } = updatedDefect;
    if (firebaseId) await updateDoc(doc(db, 'master_defects', firebaseId), data);
  },
  addDefect: async (defect) => {
    await addDoc(collection(db, 'master_defects'), { ...defect, code: `DEF-${Date.now()}` });
  },

  // Helper to seed initial data if DB is empty
  seedDatabase: async () => {
    console.log("Seeding Database...");
    const s = get();
    if (s.masterSuppliers.length === 0) {
      for (const sup of initialSuppliers) await s.addSupplier(sup);
    }
    if (s.masterItems.length === 0) {
      for (const item of initialItems) await s.addItem(item);
    }
    if (s.masterDefects.length === 0) {
      for (const def of initialDefects) await s.addDefect(def);
    }
    console.log("Database seeded successfully.");
  }
}));
