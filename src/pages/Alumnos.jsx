import { useEffect, useMemo, useState } from 'react'
import { obtenerAlumnos } from '../services/students'
import { formatoLocker } from '../utils/lockerFormat'
import { useAuth } from '../context/AuthContext'

export default function Alumnos() {
  const { perfil } = useAuth()

  const [alumnos, setAlumnos] = useState([])
  const [cargando, setCargando] = useState(true)

  const [filtroEspanol, setFiltroEspanol] = useState('')
  const [filtroIngles, setFiltroIngles] = useState('')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    obtenerAlumnos()
      .then(setAlumnos)
      .finally(() => setCargando(false))
  }, [])

  // Un tutor solo ve los alumnos de los grupos que tiene asignados.
  const alumnosVisibles = useMemo(() => {
    if (perfil?.rol === 'tutor' && perfil.grupos?.length) {
      return alumnos.filter((alumno) =>
        perfil.grupos.includes(alumno.grupoEspanol)
      )
    }

    return alumnos
  }, [alumnos, perfil])

  const gruposEspanol = useMemo(
    () =>
      [
        ...new Set(
          alumnosVisibles
            .map((a) => a.grupoEspanol)
            .filter(Boolean)
        ),
      ].sort(),
    [alumnosVisibles]
  )

  const gruposIngles = useMemo(
    () =>
      [
        ...new Set(
          alumnosVisibles
            .map((a) => a.grupoIngles)
            .filter(Boolean)
        ),
      ].sort(),
    [alumnosVisibles]
  )

  const filtrados = alumnosVisibles.filter((alumno) => {
    if (
      filtroEspanol &&
      alumno.grupoEspanol !== filtroEspanol
    ) {
      return false
    }

    if (
      filtroIngles &&
      alumno.grupoIngles !== filtroIngles
    ) {
      return false
    }

    if (
      busqueda &&
      !String(alumno.nombre || '')
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    ) {
      return false
    }

    return true
  })

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-semibold text-panel-900">
        Alumnos
      </h1>

      <p className="mb-6 text-panel-500">
        {filtrados.length} alumnos
      </p>

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={filtroEspanol}
          onChange={(e) =>
            setFiltroEspanol(e.target.value)
          }
          className="rounded-md border border-panel-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">
            Grupo de español (todos)
          </option>

          {gruposEspanol.map((grupo) => (
            <option
              key={grupo}
              value={grupo}
            >
              {grupo}
            </option>
          ))}
        </select>

        <select
          value={filtroIngles}
          onChange={(e) =>
            setFiltroIngles(e.target.value)
          }
          className="rounded-md border border-panel-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">
            Grupo de inglés (todos)
          </option>

          {gruposIngles.map((grupo) => (
            <option
              key={grupo}
              value={grupo}
            >
              {grupo}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) =>
            setBusqueda(e.target.value)
          }
          className="rounded-md border border-panel-200 bg-white px-3 py-2 text-sm"
        />
      </div>

      {cargando ? (
        <p className="text-panel-500">
          Cargando...
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-panel-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-panel-100 text-panel-600">
              <tr>
                <Th>Matrícula</Th>
                <Th>Nombre</Th>
                <Th>Grupo español</Th>
                <Th>Grupo inglés</Th>
                <Th>Tutor</Th>
                <Th>Locker</Th>
              </tr>
            </thead>

            <tbody>
              {filtrados.map((alumno) => (
                <tr
                  key={alumno.id}
                  className="border-t border-panel-100"
                >
                  <Td>
                    {alumno.matricula}
                  </Td>

                  <Td>
                    {alumno.nombre}
                  </Td>

                  <Td>
                    {alumno.grupoEspanol}
                  </Td>

                  <Td>
                    {alumno.grupoIngles}
                  </Td>

                  <Td>
                    {alumno.tutorNombre}
                  </Td>

                  <Td>
                    {alumno.lockerAsignado ? (
                      <span className="font-medium text-ok">
                        {formatoLocker(
                          alumno.lockerAsignado
                        )}
                      </span>
                    ) : (
                      <span className="text-panel-400">
                        Sin asignar
                      </span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Th({ children }) {
  return (
    <th className="px-3 py-2 font-medium">
      {children}
    </th>
  )
}

function Td({ children }) {
  return (
    <td className="px-3 py-2">
      {children}
    </td>
  )
}
