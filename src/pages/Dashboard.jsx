import { useEffect, useState } from 'react'
import { obtenerAlumnos } from '../services/students'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { perfil } = useAuth()
  const [alumnos, setAlumnos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    obtenerAlumnos()
      .then(setAlumnos)
      .finally(() => setCargando(false))
  }, [])

  const totalAlumnos = alumnos.length
  const asignados = alumnos.filter((a) => a.lockerAsignado).length
  const pendientes = totalAlumnos - asignados
  const porcentaje = totalAlumnos ? Math.round((asignados / totalAlumnos) * 100) : 0

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-semibold text-panel-900">
        Hola, {perfil?.nombre?.split(' ')[0] ?? ''}
      </h1>
      <p className="mb-8 text-panel-500">
        Estado actual de la asignación de lockers de secundaria.
      </p>

      {cargando ? (
        <p className="text-panel-500">Cargando datos...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Tarjeta etiqueta="Alumnos registrados" valor={totalAlumnos} />
          <Tarjeta etiqueta="Con locker asignado" valor={asignados} acento="text-ok" />
          <Tarjeta etiqueta="Pendientes" valor={pendientes} acento="text-alert" />
        </div>
      )}

      {!cargando && totalAlumnos > 0 && (
        <div className="mt-8">
          <div className="mb-1 flex justify-between text-sm text-panel-600">
            <span>Avance general</span>
            <span>{porcentaje}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-panel-200">
            <div
              className="h-2 rounded-full bg-brass-500"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Tarjeta({ etiqueta, valor, acento = 'text-panel-900' }) {
  return (
    <div className="rounded-lg border border-panel-200 bg-white p-5">
      <p className="text-sm text-panel-500">{etiqueta}</p>
      <p className={`font-display text-3xl font-semibold ${acento}`}>{valor}</p>
    </div>
  )
}
