import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function IconoGoogle() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4c-7.4 0-13.8 4.2-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 35 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.9 39.6 16.4 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C41.8 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  )
}

export default function Login() {
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  async function entrarConGoogle() {
    setError('')
    setEnviando(true)
    try {
      await loginWithGoogle()
      navigate('/')
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="login-bg flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 text-center shadow-lg">
        <img
          src="/logo-ibime.webp"
          alt="IBIME"
          className="mx-auto mb-5 h-16 w-auto"
        />

        <h1 className="font-display text-xl font-semibold text-panel-900">
          Asignación de Lockers
        </h1>
        <p className="mb-6 text-sm text-panel-500">
          Inicia sesión con tu cuenta institucional
        </p>

        {error && (
          <p className="mb-4 rounded-md bg-alert/10 px-3 py-2 text-sm text-alert">
            {error}
          </p>
        )}

        <button
          onClick={entrarConGoogle}
          disabled={enviando}
          className="flex w-full items-center justify-center gap-3 rounded-md border border-panel-200 bg-white py-2.5 text-sm font-medium text-panel-800 shadow-sm transition-colors hover:bg-panel-50 disabled:opacity-60"
        >
          <IconoGoogle />
          {enviando ? 'Entrando...' : 'Iniciar sesión con Google'}
        </button>

        <p className="mt-6 text-xs text-panel-400">
          ¿No tienes acceso? Pide al administrador que te dé de alta.
        </p>
      </div>
    </div>
  )
}
