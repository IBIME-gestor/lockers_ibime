import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Alumnos from './pages/Alumnos'
import AsignarLockers from './pages/AsignarLockers'
import Lockers from './pages/Lockers'
import ImportarAlumnos from './pages/ImportarAlumnos'
import Usuarios from './pages/Usuarios'
import Contraloria from './pages/Contraloria'

const TODOS = ['administrador', 'supervisor', 'tutor', 'contraloria']

function conLayout(elemento) {
  return <Layout>{elemento}</Layout>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute rolesPermitidos={TODOS}>
            {conLayout(<Dashboard />)}
          </ProtectedRoute>
        }
      />

      <Route
        path="/alumnos"
        element={
          <ProtectedRoute rolesPermitidos={TODOS}>
            {conLayout(<Alumnos />)}
          </ProtectedRoute>
        }
      />

      <Route
        path="/asignar"
        element={
          <ProtectedRoute rolesPermitidos={['administrador', 'supervisor', 'tutor']}>
            {conLayout(<AsignarLockers />)}
          </ProtectedRoute>
        }
      />

      <Route
        path="/lockers"
        element={
          <ProtectedRoute rolesPermitidos={TODOS}>
            {conLayout(<Lockers />)}
          </ProtectedRoute>
        }
      />

      <Route
        path="/importar"
        element={
          <ProtectedRoute rolesPermitidos={['administrador']}>
            {conLayout(<ImportarAlumnos />)}
          </ProtectedRoute>
        }
      />

      <Route
        path="/usuarios"
        element={
          <ProtectedRoute rolesPermitidos={['administrador']}>
            {conLayout(<Usuarios />)}
          </ProtectedRoute>
        }
      />

      <Route
        path="/contraloria"
        element={
          <ProtectedRoute rolesPermitidos={['administrador', 'contraloria']}>
            {conLayout(<Contraloria />)}
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
