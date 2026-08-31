import { createContext, useContext, useEffect, useState } from 'react'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('=== AUTH STATE ===')
      console.log('Usuario:', firebaseUser)
      
      setUser(firebaseUser)

      if (firebaseUser) {
        try {
          const uid = firebaseUser.uid

          console.log('UID:', uid)
          console.log('Email:', firebaseUser.email)
          console.log('Buscando documento:', `usuarios/${uid}`)

          const referencia = doc(db, 'usuarios', uid)
          const snap = await getDoc(referencia)

          console.log('¿Documento existe?:', snap.exists())

          if (snap.exists()) {
            console.log('Perfil encontrado:', snap.data())
            setPerfil(snap.data())
          } else {
            console.error('NO EXISTE EL PERFIL EN FIRESTORE')
            setPerfil(null)
          }
        } catch (error) {
          console.error('ERROR LEYENDO PERFIL:', error)
          setPerfil(null)
        }
      } else {
        setPerfil(null)
      }

      setCargando(false)
      console.log('==================')
    })

    return unsub
  }, [])

  const loginWithGoogle = async () => {
    try {
      console.log('=== INICIANDO LOGIN GOOGLE ===')

      const resultado = await signInWithPopup(auth, googleProvider)

      const correo = resultado.user.email || ''
      const uid = resultado.user.uid
      const dominioPermitido = import.meta.env.VITE_ALLOWED_DOMAIN

      console.log('Correo:', correo)
      console.log('UID:', uid)
      console.log('Dominio permitido:', dominioPermitido)
      console.log('Proyecto Firebase:', import.meta.env.VITE_FIREBASE_PROJECT_ID)

      if (
        dominioPermitido &&
        !correo.toLowerCase().endsWith(`@${dominioPermitido.toLowerCase()}`)
      ) {
        await signOut(auth)

        throw new Error(
          `Usa tu cuenta institucional (@${dominioPermitido}) para iniciar sesión.`
        )
      }

      const referencia = doc(db, 'usuarios', uid)

      console.log('Buscando:', `usuarios/${uid}`)

      const snap = await getDoc(referencia)

      console.log('Documento existe:', snap.exists())

      if (!snap.exists()) {
        console.error('NO SE ENCONTRÓ EL USUARIO EN FIRESTORE')
        console.error('UID buscado:', uid)

        await signOut(auth)

        throw new Error(
          'Tu cuenta aún no tiene acceso a esta plataforma. Pide al administrador que te dé de alta en "Usuarios y roles".'
        )
      }

      console.log('PERFIL ENCONTRADO:', snap.data())
      console.log('=== LOGIN CORRECTO ===')

      return resultado

    } catch (error) {
      console.error('ERROR DURANTE LOGIN:', error)
      throw error
    }
  }

  const logout = () => signOut(auth)

  const tienePermiso = (rolesPermitidos) =>
    perfil && rolesPermitidos.includes(perfil.rol)

  const value = {
    user,
    perfil,
    cargando,
    loginWithGoogle,
    logout,
    tienePermiso
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
