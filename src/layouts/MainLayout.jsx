import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';

const MainLayout = () => {
  const location = useLocation();
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const navItems = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/inspect', icon: 'add_box', label: 'Inspect' },
    { path: '/history', icon: 'history', label: 'History' },
    { path: '/suppliers', icon: 'assessment', label: 'Suppliers' },
    { path: '/master', icon: 'database', label: 'Master' },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Desktop Header */}
      <header className="hidden md:flex justify-between items-center px-md h-16 w-full top-0 bg-[#0f172a] shadow-sm z-50 fixed">
        <div className="flex items-center gap-sm hover:bg-on-surface-variant/10 transition-colors duration-200 p-2 rounded-lg cursor-pointer">
          <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>factory</span>
          <span className="text-headline-md font-bold text-white">Quality Manager</span>
        </div>
        
        <nav className="flex gap-lg items-center">
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              className={({ isActive }) => `flex items-center gap-xs group transition-colors ${isActive ? 'text-white' : 'text-outline-variant hover:text-white'}`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-label-caps uppercase">{item.label}</span>
            </NavLink>
          ))}
          
          {installPrompt && (
            <button 
              onClick={handleInstallClick}
              className="ml-4 flex items-center gap-2 bg-primary text-on-primary px-4 py-1.5 rounded-full text-label-caps font-bold hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              INSTALL APP
            </button>
          )}
        </nav>
        
        <button className="text-outline-variant hover:bg-on-surface-variant/10 p-2 rounded-full transition-colors duration-200">
          <span className="material-symbols-outlined">filter_list</span>
        </button>
      </header>

      {/* Spacer for desktop header */}
      <div className="hidden md:block w-full h-16"></div>

      {/* Mobile Install Banner (if prompt is available) */}
      {installPrompt && (
        <div className="md:hidden fixed top-0 left-0 w-full bg-primary text-on-primary p-3 flex justify-between items-center z-50 shadow-md">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">system_update</span>
            <span className="font-medium text-sm">Install App for better experience</span>
          </div>
          <button 
            onClick={handleInstallClick}
            className="bg-white text-primary px-3 py-1 rounded-full text-xs font-bold uppercase"
          >
            Install
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 w-full max-w-[1440px] mx-auto p-container-margin md:p-lg md:mt-16 overflow-x-hidden ${installPrompt ? 'mt-12' : ''}`}>
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 pb-1 bg-surface/90 backdrop-blur-md border-t border-outline-variant shadow-lg px-2 mb-3 rounded-full mx-2 max-w-[calc(100%-16px)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink 
              key={item.path} 
              to={item.path}
              className={isActive 
                ? "flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full h-10 w-10 shadow-sm mx-1"
                : "flex flex-col items-center justify-center text-on-secondary-container px-1 py-1 hover:text-primary transition-all active:scale-95 duration-150 flex-1"
              }
            >
              <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill' : 'mb-0.5'}`}>{item.icon}</span>
              {!isActive && <span className="text-[8px] font-medium tracking-tight uppercase leading-none text-center">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default MainLayout;
