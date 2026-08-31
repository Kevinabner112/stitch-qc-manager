import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    clearError();
    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-outline-variant/30">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="QCInc Logo" className="h-16 w-auto object-contain bg-white rounded-xl p-1 mb-4 shadow-sm" />
          <h1 className="text-headline-md font-bold text-on-surface text-center">Login to QCInc</h1>
          <p className="text-body-md text-on-surface-variant text-center mt-2">Enterprise Quality Control Manager</p>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/30 text-error p-3 rounded-lg text-sm mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="block text-body-sm font-medium text-on-surface mb-1" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium text-on-surface mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold text-white shadow-md transition-all mt-4 flex items-center justify-center gap-2 ${
              loading ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">login</span>
                Sign In
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
