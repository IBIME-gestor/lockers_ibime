import { createContext, useContext, useEffect, useState } from 'react'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'

/*
  Modelo de roles:
  - administrador: acceso total (usuarios, alumnos, lockers, reportes)
  - supervisor: puede ver y asignar lockers de cualquier grupo, revisar avances
  - tutor: solo ve y asigna lockers de los grupos que tiene asignados
  - contraloria: acceso de solo lectura a todo (auditoría, reportes, historial)

  Cada documento en /usuarios/{uid} tiene:
  { nombre, correo, rol, grupos: ['1A','1B', ...] } // "grupos" solo aplica a tutores
*/

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'usuarios', firebaseUser.uid))
        setPerfil(snap.exists() ? snap.data() : null)
      } else {
        setPerfil(null)
      }
      setCargando(false)
    })
    return unsub
  }, [])

  // Inicia sesión con la cuenta institucional de Google.
  // Si el correo no es del dominio permitido, o si la cuenta no tiene un
  // perfil dado de alta en /usuarios, se cierra la sesión y se avisa.
  const loginWithGoogle = async () => {
    const resultado = await signInWithPopup(auth, googleProvider)
    const correo = resultado.user.email || ''
    const dominioPermitido = import.meta.env.VITE_ALLOWED_DOMAIN

    if (
      dominioPermitido &&
      !correo.toLowerCase().endsWith(`@${dominioPermitido.toLowerCase()}`)
    ) {
      await signOut(auth)
      throw new Error(
        `Usa tu cuenta institucional (@${dominioPermitido}) para iniciar sesión.`
      )
    }

    const snap = await getDoc(doc(db, 'usuarios', resultado.user.uid))
    if (!snap.exists()) {
      await signOut(auth)
      throw new Error(
        'Tu cuenta aún no tiene acceso a esta plataforma. Pide al administrador que te dé de alta en "Usuarios y roles".'
      )
    }

    return resultado
  }

  const logout = () => signOut(auth)

  const tienePermiso = (rolesPermitidos) =>
    perfil && rolesPermitidos.includes(perfil.rol)

  const value = { user, perfil, cargando, loginWithGoogle, logout, tienePermiso }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
