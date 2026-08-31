import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "qc-inspection-a2c80.firebaseapp.com",
  projectId: "qc-inspection-a2c80",
  storageBucket: "qc-inspection-a2c80.firebasestorage.app",
  messagingSenderId: "84287012284",
  appId: "1:84287012284:web:6341e9e477b491c5b3ffb9",
  measurementId: "G-V6CRRDF824"
};

const app = initializeApp(firebaseConfig);
// Initialize analytics only if in browser environment
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const db = getFirestore(app);
export const auth = getAuth(app);
