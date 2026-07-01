import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDL0YiXAymB0h0Wa4KJ-Ia1G9hsgHomt7U",
  authDomain: "activitylink-1b1e8.firebaseapp.com",
  projectId: "activitylink-1b1e8",
  storageBucket: "activitylink-1b1e8.firebasestorage.app",
  messagingSenderId: "518559413909",
  appId: "1:518559413909:web:5e3b4d593c5edfbaa1cd9c",
  measurementId: "G-HVDPQ8WNKQ"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
