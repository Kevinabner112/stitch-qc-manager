import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import NewInspection from './pages/NewInspection';
import History from './pages/History';
import SupplierPerformance from './pages/SupplierPerformance';
import MasterData from './pages/MasterData';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import AccountSettings from './pages/AccountSettings';
import { useInspectionStore } from './store/useInspectionStore';
import { useAuthStore } from './store/useAuthStore';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect based on role if access is denied
    if (role === 'viewer') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/inspect" replace />;
  }

  return children;
};

function App() {
  const initFirebaseListeners = useInspectionStore((state) => state.initFirebaseListeners);
  const initAuthListener = useAuthStore((state) => state.initAuthListener);

  useEffect(() => {
    const unsubscribeAuth = initAuthListener();
    initFirebaseListeners();
    
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, [initFirebaseListeners, initAuthListener]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          <Route path="dashboard" element={
            <ProtectedRoute allowedRoles={['admin', 'inspector', 'viewer']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="inspect" element={
            <ProtectedRoute allowedRoles={['admin', 'inspector']}>
              <NewInspection />
            </ProtectedRoute>
          } />
          
          <Route path="history" element={<History />} />
          
          <Route path="suppliers" element={
            <ProtectedRoute allowedRoles={['admin', 'inspector']}>
              <SupplierPerformance />
            </ProtectedRoute>
          } />
          
          <Route path="master" element={
            <ProtectedRoute allowedRoles={['admin', 'inspector']}>
              <MasterData />
            </ProtectedRoute>
          } />

          <Route path="users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          } />

          <Route path="account" element={<AccountSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
