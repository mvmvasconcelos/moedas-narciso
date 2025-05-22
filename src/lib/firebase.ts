
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "xxx",
  authDomain: "moedas-narciso.firebaseapp.com",
  projectId: "moedas-narciso",
  storageBucket: "moedas-narciso.firebasestorage.app",
  messagingSenderId: "725003401777",
  appId: "1:725003401777:web:1675e0970cb4d5295ab310"
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
