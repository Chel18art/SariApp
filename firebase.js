import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCDf55x6uWkRrByKZmdAoDvNUoniMebtmI",
  authDomain: "sariapp-7875c.firebaseapp.com",
  projectId: "sariapp-7875c",
  storageBucket: "sariapp-7875c.firebasestorage.app",
  messagingSenderId: "692798417216",
  appId: "1:692798417216:web:da591f904cbe6605e4b2a5",
  measurementId: "G-6N26V42SVH"
};

// 1. Initialize Firebase App
const app = initializeApp(firebaseConfig);

// 2. Initialize Firestore with Offline Persistence & Long Polling
// Ang 'experimentalForceLongPolling' makatabang para dili ma-timeout ang connection
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ 
    tabManager: persistentMultipleTabManager() 
  }),
  experimentalForceLongPolling: true, // Importante ni para sa stable connection
});