import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDJQrbx7CBcKoPrqqaj0ZKhDA9r2_c7N0c",
  authDomain: "qc-inspection-a2c80.firebaseapp.com",
  projectId: "qc-inspection-a2c80",
  storageBucket: "qc-inspection-a2c80.firebasestorage.app",
  messagingSenderId: "84287012284",
  appId: "1:84287012284:web:6341e9e477b491c5b3ffb9",
  measurementId: "G-V6CRRDF824"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    console.log("Mencoba menyimpan data ke Firestore...");
    const docRef = await addDoc(collection(db, "test_connection"), {
      message: "Test koneksi sukses!",
      time: new Date()
    });
    console.log("=========================================");
    console.log("BERHASIL! Aturan (Rules) Firestore sudah terbuka.");
    console.log("ID Data Percobaan: " + docRef.id);
    console.log("=========================================");
    await deleteDoc(docRef);
    process.exit(0);
  } catch (error) {
    console.error("=========================================");
    console.error("GAGAL! Firebase masih menolak akses simpan data.");
    console.error("Pesan Error: ", error.message);
    console.error("=========================================");
    process.exit(1);
  }
}

test();
