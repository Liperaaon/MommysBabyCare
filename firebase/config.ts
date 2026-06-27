import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase only if it hasn't been initialized already (important for React Native / Expo)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
// Conectar especificamente ao banco de dados chamado "default" (sem parênteses)
const db = getFirestore(app, "default");
const storage = getStorage(app);

export { app, db, storage };
