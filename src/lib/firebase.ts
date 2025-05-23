
// Este arquivo está intencionalmente limpo para remover a dependência do Firebase.
// A inicialização do Firebase e a configuração foram removidas.
// A aplicação usará um sistema mockado/local para autenticação e dados.

// Se você decidir reintegrar o Firebase no futuro, este arquivo precisará
// ser preenchido com a configuração do seu projeto Firebase e a inicialização
// dos serviços Firebase (Auth, Firestore, etc.).

// Exemplo de como seria com o Firebase (NÃO USAR AGORA):
/*
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  // Suas credenciais do Firebase aqui
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

auth = getAuth(app);
db = getFirestore(app);

export { app, auth, db };
*/

// Por enquanto, não exportamos nada ou exportamos objetos vazios/mockados
// se outros arquivos ainda tentarem importar daqui, embora o ideal seja
// remover essas importações se não forem mais necessárias.
export const app = undefined;
export const auth = undefined;
export const db = undefined;
