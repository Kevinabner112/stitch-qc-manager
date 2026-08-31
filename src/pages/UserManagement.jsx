import React, { useEffect, useState } from 'react';
import { useUserStore } from '../store/useUserStore';

const UserManagement = () => {
  const { users, loading, error, fetchUsers, createUser, updateUserRole, deleteUser, resetPassword, clearError } = useUserStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('inspector');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    clearError();
    setSuccessMsg('');
    
    if (password.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    if (!username.trim()) {
      alert('Username is required.');
      return;
    }

    const result = await createUser(email, password, role, username);
    if (result.success) {
      setSuccessMsg(`User ${username} (${email}) created successfully!`);
      setUsername('');
      setEmail('');
      setPassword('');
      setRole('inspector');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    await updateUserRole(userId, newRole);
  };

  const handleResetPassword = async (email) => {
    if(window.confirm(`Kirim email reset password ke ${email}?`)) {
      const result = await resetPassword(email);
      if (result.success) {
        setSuccessMsg(`Email reset password berhasil dikirim ke ${email}.`);
      } else {
        alert(`Gagal mengirim email reset: ${result.error}`);
      }
    }
  };

  return (
    <div className="animate-fade-in pb-20 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">User Management</h1>
          <p className="text-body-md text-on-surface-variant">Manage application access and roles</p>
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/30 text-error p-3 rounded-lg text-sm mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">error</span>
          {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-[#4ade80]/20 border border-[#4ade80]/50 text-[#166534] p-3 rounded-lg text-sm mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add New User Form */}
        <div className="lg:col-span-1">
          <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 shadow-sm sticky top-24">
            <h2 className="text-title-lg font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">person_add</span>
              Add New User
            </h2>
            
            <form onSubmit={handleAddUser} className="flex flex-col gap-4">
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white"
                  placeholder="johndoe"
                />
              </div>

              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white"
                  placeholder="user@qcinc.com"
                />
              </div>

              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white"
                  placeholder="Min. 6 characters"
                />
              </div>

              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white"
                >
                  <option value="admin">Admin (Full Access)</option>
                  <option value="inspector">Inspector (Add/View Data)</option>
                  <option value="viewer">Viewer (View/Export Only)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`mt-2 py-2.5 rounded-lg font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                  loading ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Create User
                  </>
                )}
              </button>
              <p className="text-[11px] text-on-surface-variant text-center mt-1">
                Creating a user here will not sign you out.
              </p>
            </form>
          </div>
        </div>

        {/* User List */}
        <div className="lg:col-span-2">
          <div className="bg-surface-container rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-outline-variant/30 bg-surface flex justify-between items-center">
              <h2 className="text-title-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined">group</span>
                Registered Users
              </h2>
              <button 
                onClick={() => fetchUsers()} 
                disabled={loading}
                className="p-1.5 rounded-full hover:bg-surface-container-high text-primary transition-colors"
                title="Refresh List"
              >
                <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-label-lg uppercase tracking-wider">
                    <th className="p-4 font-medium border-b border-outline-variant/30">User</th>
                    <th className="p-4 font-medium border-b border-outline-variant/30">Role</th>
                    <th className="p-4 font-medium border-b border-outline-variant/30 hidden sm:table-cell">Created At</th>
                    <th className="p-4 font-medium border-b border-outline-variant/30 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-outline-variant/20 hover:bg-surface-container-lowest transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-on-surface">{user.username || user.email.split('@')[0]}</div>
                        <div className="text-sm text-on-surface-variant">{user.email || 'No Email'}</div>
                        <div className="text-xs text-on-surface-variant/50 hidden sm:block font-mono mt-1">{user.id}</div>
                      </td>
                      <td className="p-4">
                        <select
                          value={user.role || 'inspector'}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={loading}
                          className={`px-2 py-1.5 rounded-lg border text-sm font-medium outline-none transition-all ${
                            user.role === 'admin' 
                              ? 'bg-primary-container text-on-primary-container border-primary/30' 
                              : user.role === 'viewer'
                                ? 'bg-[#fef08a]/50 text-[#854d0e] border-[#fef08a]'
                                : 'bg-secondary-container text-on-secondary-container border-secondary/30'
                          }`}
                        >
                          <option value="admin">Admin</option>
                          <option value="inspector">Inspector</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </td>
                      <td className="p-4 text-body-sm text-on-surface-variant hidden sm:table-cell">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-4 text-right flex justify-end gap-1">
                        <button 
                          onClick={() => handleResetPassword(user.email)}
                          disabled={loading || !user.email}
                          className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors disabled:opacity-50"
                          title="Kirim Email Reset Password"
                        >
                          <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                        </button>
                        <button 
                          onClick={() => {
                            if(window.confirm(`Hapus user ${user.email}?`)) {
                              deleteUser(user.id);
                            }
                          }}
                          disabled={loading}
                          className="text-error hover:bg-error/10 p-2 rounded-full transition-colors disabled:opacity-50"
                          title="Delete User"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && !loading && (
                    <tr>
                      <td colSpan="3" className="p-8 text-center text-on-surface-variant">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
