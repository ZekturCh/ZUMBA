import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDnPcu_X7WU1lRhWEJJWuk3tKzoI2UQtaA",
  authDomain: "zumba-55920.firebaseapp.com",
  projectId: "zumba-55920",
  storageBucket: "zumba-55920.firebasestorage.app",
  messagingSenderId: "932554985572",
  appId: "1:932554985572:web:3f97056cd608424a738f71",
  measurementId: "G-50NFKJE6WN"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
