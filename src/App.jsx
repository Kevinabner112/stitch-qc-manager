import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import NewInspection from './pages/NewInspection';
import History from './pages/History';
import SupplierPerformance from './pages/SupplierPerformance';
import MasterData from './pages/MasterData';
import { useInspectionStore } from './store/useInspectionStore';

function App() {
  const initFirebaseListeners = useInspectionStore((state) => state.initFirebaseListeners);

  useEffect(() => {
    initFirebaseListeners();
  }, [initFirebaseListeners]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="inspect" element={<NewInspection />} />
          <Route path="history" element={<History />} />
          <Route path="suppliers" element={<SupplierPerformance />} />
          <Route path="master" element={<MasterData />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
