import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
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

async function check() {
  try {
    const q = query(collection(db, "inspections"), orderBy("createdAt", "desc"), limit(3));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log("No inspections found.");
    } else {
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`\nInspection: ${doc.id}`);
        if (data.photos && data.photos.length > 0) {
          console.log(`Has ${data.photos.length} photos.`);
          const sample = data.photos[0].substring(0, 50);
          console.log(`Photo 1 begins with: ${sample}`);
        } else {
          console.log("No photos in this inspection.");
        }
      });
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

check();
