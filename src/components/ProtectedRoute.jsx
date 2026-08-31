import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, rolesPermitidos }) {
  const { user, perfil, cargando } = useAuth()

  if (cargando) return <div className="p-8 text-panel-500">Cargando...</div>
  if (!user || !perfil) return <Navigate to="/login" replace />

  if (rolesPermitidos && !rolesPermitidos.includes(perfil.rol)) {
    return (
      <div className="p-8">
        <p className="text-alert font-medium">
          No tienes permiso para ver esta sección.
        </p>
      </div>
    )
  }

  return children
}
