import { create } from 'zustand';
import { auth, db } from '../config/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const useAuthStore = create((set, get) => ({
  user: null,
  role: null, // 'admin' | 'inspector' | null
  userData: null, // to store extra data like username
  loading: true,
  error: null,

  // Initialize Auth Listener
  initAuthListener: () => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch user role from Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          let userRole = 'inspector'; // Default role
          let userData = null;
          
          if (userDocSnap.exists()) {
            userData = userDocSnap.data();
            userRole = userData.role || 'inspector';
          } else {
            // Create user document with default role if it doesn't exist
            userData = { role: 'inspector', email: user.email };
            await setDoc(userDocRef, userData);
          }
          
          set({ user, role: userRole, userData, loading: false });
        } catch (error) {
          console.error("Error fetching user role:", error);
          set({ user, role: 'inspector', userData: null, loading: false }); // Fallback
        }
      } else {
        set({ user: null, role: null, userData: null, loading: false });
      }
    });
  },

  // Login function
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting the user and role
      return { success: true };
    } catch (error) {
      set({ loading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Logout function
  logout: async () => {
    set({ loading: true, error: null });
    try {
      await signOut(auth);
      set({ user: null, role: null, loading: false });
      return { success: true };
    } catch (error) {
      set({ loading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },
  
  clearError: () => set({ error: null })
}));
