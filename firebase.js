import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCDf55x6uWkRrByKZmdAoDvNUoniMebtmI",
  authDomain: "sariapp-7875c.firebaseapp.com",
  projectId: "sariapp-7875c",
  storageBucket: "sariapp-7875c.firebasestorage.app",
  messagingSenderId: "692798417216",
  appId: "1:692798417216:web:da591f904cbe6605e4b2a5",
  measurementId: "G-6N26V42SVH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and export it
export const db = getFirestore(app);