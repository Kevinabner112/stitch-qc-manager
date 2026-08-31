import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import "dotenv/config";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: "qc-inspection-a2c80.firebaseapp.com",
  projectId: "qc-inspection-a2c80",
  storageBucket: "qc-inspection-a2c80.firebasestorage.app",
  messagingSenderId: "84287012284",
  appId: "1:84287012284:web:6341e9e477b491c5b3ffb9",
  measurementId: "G-V6CRRDF824"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clean() {
  const snapshot = await getDocs(collection(db, "inspections"));
  snapshot.forEach(async (d) => {
    const data = d.data();
    if (data.photos && data.photos.length > 0 && data.photos[0].startsWith('blob:')) {
      console.log('Deleting broken inspection: ' + d.id);
      await deleteDoc(doc(db, "inspections", d.id));
    }
  });
  console.log("Cleanup done.");
}
clean();
