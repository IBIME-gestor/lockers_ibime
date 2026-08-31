import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Estas variables se leen del archivo .env (ver .env.example)
// Nunca subas tu .env real al repositorio.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Login con la cuenta institucional de Google.
// VITE_ALLOWED_DOMAIN (ej. "colegioibime.edu.mx") limita el selector de
// cuentas de Google a ese dominio. La validación real de acceso sigue
// dependiendo de que exista el documento /usuarios/{uid} en Firestore.
export const googleProvider = new GoogleAuthProvider()
const dominioInstitucional = import.meta.env.VITE_ALLOWED_DOMAIN
if (dominioInstitucional) {
  googleProvider.setCustomParameters({ hd: dominioInstitucional })
}
