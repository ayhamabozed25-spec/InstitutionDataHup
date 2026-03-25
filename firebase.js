import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
 apiKey: "AIzaSyA7qW5bjTPQA0q9XgKd6OHDzaNCDbtz2z0",
  authDomain: "firestore-1488a.firebaseapp.com",
  databaseURL: "https://firestore-1488a-default-rtdb.firebaseio.com",
  projectId: "firestore-1488a",
  storageBucket: "firestore-1488a.firebasestorage.app",
  messagingSenderId: "284773652304",
  appId: "1:284773652304:web:f379106224b0570b91fe55",
  measurementId: "G-FZJMJ7RPGT"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
