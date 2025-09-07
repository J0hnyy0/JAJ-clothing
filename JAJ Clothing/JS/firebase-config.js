// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyDy19pPW93gdTisOsKwGw46rcjIMeu1ltM",
  authDomain: "jaj-clothing-22dbe.firebaseapp.com",
  projectId: "jaj-clothing-22dbe",
  storageBucket: "jaj-clothing-22dbe.firebasestorage.app",
  messagingSenderId: "154288386048",
  appId: "1:154288386048:web:a96b7a0bef1e9b2a6ba8e5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);


