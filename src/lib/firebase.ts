
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBKNvT8HfGUAGpsT2PkK9L0vy7j7-uwat4",
  authDomain: "moedas-narciso-app.firebaseapp.com",
  projectId: "moedas-narciso-app",
  storageBucket: "moedas-narciso-app.firebasestorage.app",
  messagingSenderId: "680084547843",
  appId: "1:680084547843:web:3e94f925a347f203502136",
  // measurementId: "G-B80V27ZJ5Y" // Removido para evitar erros de gtag não relacionados
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
