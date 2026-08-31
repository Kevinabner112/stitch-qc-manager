import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

const AccountSettings = () => {
  const { user, role } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError("Password baru dan konfirmasi tidak cocok.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password baru minimal 6 karakter.");
      return;
    }

    setLoading(true);
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setError("Anda belum login.");
      setLoading(false);
      return;
    }

    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, newPassword);
      
      setMessage("Password berhasil diubah!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError("Password saat ini salah.");
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold text-on-surface mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined">manage_accounts</span>
        Pengaturan Akun
      </h1>

      <div className="bg-surface-container rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-outline-variant/30 bg-surface">
          <h2 className="text-lg font-bold text-on-surface">Informasi Akun</h2>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <p className="text-sm font-bold text-on-surface-variant uppercase mb-1">Email</p>
            <p className="text-base text-on-surface">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface-variant uppercase mb-1">Jabatan (Role)</p>
            <p className="text-base text-on-surface capitalize">{role}</p>
          </div>
        </div>
      </div>

      <div className="bg-surface-container rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline-variant/30 bg-surface">
          <h2 className="text-lg font-bold text-on-surface">Ubah Password</h2>
        </div>
        <div className="p-6">
          {message && (
            <div className="mb-4 p-3 bg-primary-container/30 border border-primary/50 text-primary rounded-lg text-sm font-medium">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-error-container/30 border border-error/50 text-error rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-on-surface-variant">Password Saat Ini</label>
              <input 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white"
                placeholder="Masukkan password Anda saat ini"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-on-surface-variant">Password Baru</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white"
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-on-surface-variant">Konfirmasi Password Baru</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white"
                placeholder="Ketik ulang password baru"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`mt-4 py-2.5 rounded-lg font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                loading ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
              ) : (
                'Simpan Password Baru'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
