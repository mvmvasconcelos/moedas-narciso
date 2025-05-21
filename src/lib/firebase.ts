
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// IMPORTANTE: Substitua estes valores pelos valores reais do seu projeto Firebase!
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Substitua pelo seu API Key
  authDomain: "YOUR_AUTH_DOMAIN", // Ex: seu-projeto-id.firebaseapp.com
  projectId: "YOUR_PROJECT_ID", // Substitua pelo seu Project ID
  storageBucket: "YOUR_STORAGE_BUCKET", // Ex: seu-projeto-id.appspot.com
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  // measurementId: "YOUR_MEASUREMENT_ID" // Opcional, para Google Analytics
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Garante que o Firebase seja inicializado apenas uma vez (importante para Next.js e HMR)
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

auth = getAuth(app);
db = getFirestore(app);

export { app, auth, db };
