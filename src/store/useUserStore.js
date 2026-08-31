import { create } from 'zustand';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, firebaseConfig } from '../config/firebase';

// Initialize a secondary app for creating users so the admin doesn't get logged out
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

export const useUserStore = create((set, get) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      set({ users: usersData, loading: false });
    } catch (error) {
      console.error("Error fetching users:", error);
      set({ error: error.message, loading: false });
    }
  },

  createUser: async (email, password, role, username) => {
    set({ loading: true, error: null });
    try {
      // Create user using secondary auth instance
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const newUser = userCredential.user;

      // Save user role in Firestore
      await setDoc(doc(db, 'users', newUser.uid), {
        email: email,
        role: role,
        username: username || email.split('@')[0],
        createdAt: new Date().toISOString()
      });

      // Sign out the secondary auth instance just to be safe
      await signOut(secondaryAuth);

      // Refresh user list
      await get().fetchUsers();
      
      set({ loading: false });
      return { success: true };
    } catch (error) {
      console.error("Error creating user:", error);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  updateUserRole: async (userId, newRole) => {
    set({ loading: true, error: null });
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole
      });
      
      // Update local state
      set((state) => ({
        users: state.users.map(u => u.id === userId ? { ...u, role: newRole } : u),
        loading: false
      }));
      return { success: true };
    } catch (error) {
      console.error("Error updating user role:", error);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  deleteUser: async (userId) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'users', userId));
      // Update local state
      set((state) => ({
        users: state.users.filter(u => u.id !== userId),
        loading: false
      }));
      return { success: true };
    } catch (error) {
      console.error("Error deleting user:", error);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  resetPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      set({ loading: false });
      return { success: true };
    } catch (error) {
      console.error("Error sending password reset email:", error);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  clearError: () => set({ error: null })
}));
