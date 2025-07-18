import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBgQsnu1Npyz-GzrbPyk_op5f-grtWQnMU",
  authDomain: "cs110-56a64.firebaseapp.com",
  projectId: "cs110-56a64",
  storageBucket: "cs110-56a64.firebasestorage.app",
  messagingSenderId: "776243128771",
  appId: "1:776243128771:web:64b0f0fcc5cb0c873ff576"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);  // Changed from 'firestore' to 'db'
export const auth = getAuth(app);