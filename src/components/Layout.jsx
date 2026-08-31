import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ETIQUETAS_ROL = {
  administrador: 'Administrador',
  supervisor: 'Supervisor',
  tutor: 'Tutor',
  contraloria: 'Contraloría',
}

const linkClase = ({ isActive }) =>
  `block rounded-md px-3 py-2 text-sm transition-colors ${
    isActive
      ? 'bg-panel-700 text-white'
      : 'text-panel-200 hover:bg-panel-800 hover:text-white'
  }`

export default function Layout({ children }) {
  const { perfil, logout } = useAuth()
  const navigate = useNavigate()

  const rol = perfil?.rol

  async function salir() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 flex-shrink-0 bg-panel-900 p-4 flex flex-col">
        <div className="mb-6 flex items-center gap-2 px-2">
          <img src="/logo-ibime.webp" alt="IBIME" className="h-9 w-auto" />
          <div>
            <p className="font-display text-lg font-semibold text-white">Lockers</p>
            <p className="text-xs text-panel-300">Secundaria · Ciclo 26-27</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <NavLink to="/" className={linkClase} end>
            Panel principal
          </NavLink>
          <NavLink to="/alumnos" className={linkClase}>
            Alumnos
          </NavLink>
          {(rol === 'administrador' || rol === 'supervisor' || rol === 'tutor') && (
            <NavLink to="/asignar" className={linkClase}>
              Asignar lockers
            </NavLink>
          )}
          <NavLink to="/lockers" className={linkClase}>
            Mapa de lockers
          </NavLink>
          {rol === 'administrador' && (
            <>
              <NavLink to="/importar" className={linkClase}>
                Importar alumnos
              </NavLink>
              <NavLink to="/usuarios" className={linkClase}>
                Usuarios y roles
              </NavLink>
            </>
          )}
          {(rol === 'contraloria' || rol === 'administrador') && (
            <NavLink to="/contraloria" className={linkClase}>
              Contraloría / Reportes
            </NavLink>
          )}
        </nav>

        <div className="mt-4 border-t border-panel-700 pt-4 px-2">
          <p className="text-sm text-white">{perfil?.nombre}</p>
          <p className="text-xs text-brass-400">{ETIQUETAS_ROL[rol] ?? rol}</p>
          <button
            onClick={salir}
            className="mt-3 text-xs text-panel-300 hover:text-white underline"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="bg-brand flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-8">{children}</div>
      </main>
    </div>
  )
}
