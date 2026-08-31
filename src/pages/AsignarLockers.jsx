import { useState } from 'react'
import { obtenerAlumnosPorGrupo } from '../services/students'
import {
  generarRangoLockers,
  obtenerLockersPorUbicacion,
  guardarAsignaciones,
} from '../services/lockers'
import { generarPropuestaAsignacion } from '../utils/assignmentAlgorithm'
import { useAuth } from '../context/AuthContext'

const PLANTAS = ['Planta baja', 'Primer piso', 'Segundo piso']

export default function AsignarLockers() {
  const { perfil } = useAuth()

  const [tipoFiltro, setTipoFiltro] = useState('grupoEspanol')
  const [valorGrupo, setValorGrupo] = useState('')
  const [edificio, setEdificio] = useState('A')
  const [planta, setPlanta] = useState(PLANTAS[0])
  const [numeroInicio, setNumeroInicio] = useState('')
  const [numeroFin, setNumeroFin] = useState('')

  const [alumnosFiltrados, setAlumnosFiltrados] = useState(null)
  const [lockersUbicacion, setLockersUbicacion] = useState([])
  const [filas, setFilas] = useState([]) // [{alumno, locker}]
  const [sinLocker, setSinLocker] = useState([])
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function generarPropuesta() {
    if (!valorGrupo || !numeroInicio || !numeroFin) {
      setMensaje('Completa el grupo y el rango de lockers antes de continuar.')
      return
    }
    setMensaje('')
    setCargando(true)
    try {
      const alumnos = await obtenerAlumnosPorGrupo(tipoFiltro, valorGrupo)
      setAlumnosFiltrados(alumnos)

      await generarRangoLockers(edificio, planta, Number(numeroInicio), Number(numeroFin))
      const lockers = await obtenerLockersPorUbicacion(edificio, planta)
      const lockersEnRango = lockers.filter(
        (l) => l.numero >= Number(numeroInicio) && l.numero <= Number(numeroFin)
      )
      setLockersUbicacion(lockersEnRango)

      const { propuesta, sinLocker } = generarPropuestaAsignacion(alumnos, lockersEnRango)
      setFilas(propuesta)
      setSinLocker(sinLocker)
    } finally {
      setCargando(false)
    }
  }

  // Intercambia el locker de dos filas cuando el usuario elige, en el select
  // de una fila, un locker que ya está propuesto para otro alumno.
  function cambiarLockerDeFila(indice, nuevoLockerId) {
    setFilas((prev) => {
      const nuevoLocker = lockersUbicacion.find((l) => l.id === nuevoLockerId)
      if (!nuevoLocker) return prev

      const copia = [...prev]
      const indiceConflicto = copia.findIndex(
        (f, i) => i !== indice && f.locker.id === nuevoLockerId
      )
      if (indiceConflicto !== -1) {
        const lockerAnterior = copia[indice].locker
        copia[indiceConflicto] = { ...copia[indiceConflicto], locker: lockerAnterior }
      }
      copia[indice] = { ...copia[indice], locker: nuevoLocker }
      return copia
    })
  }

  async function confirmarYGuardar() {
    setGuardando(true)
    setMensaje('')
    try {
      await guardarAsignaciones(
        filas.map((f) => ({
          alumno: { matricula: f.alumno.matricula, nombre: f.alumno.nombre },
          locker: f.locker,
        }))
      )
      setMensaje(`Se guardaron ${filas.length} asignaciones correctamente.`)
      setFilas([])
      setAlumnosFiltrados(null)
    } catch (err) {
      setMensaje('Ocurrió un error al guardar. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  const gruposDisponibles =
    perfil?.rol === 'tutor' && perfil.grupos?.length && tipoFiltro === 'grupoEspanol'
      ? perfil.grupos
      : null

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-semibold text-panel-900">
        Asignar lockers
      </h1>
      <p className="mb-6 text-panel-500">
        Filtra un grupo, define la ubicación y el rango de lockers a entregar, y
        revisa la propuesta antes de guardarla.
      </p>

      <div className="mb-6 grid grid-cols-1 gap-4 rounded-md border border-panel-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
        <Campo etiqueta="Filtrar por">
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="input"
          >
            <option value="grupoEspanol">Grupo de español</option>
            <option value="grupoIngles">Grupo de inglés</option>
          </select>
        </Campo>

        <Campo etiqueta="Grupo">
          {gruposDisponibles ? (
            <select
              value={valorGrupo}
              onChange={(e) => setValorGrupo(e.target.value)}
              className="input"
            >
              <option value="">Selecciona...</option>
              {gruposDisponibles.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="Ej. 1A"
              value={valorGrupo}
              onChange={(e) => setValorGrupo(e.target.value)}
              className="input"
            />
          )}
        </Campo>

        <Campo etiqueta="Edificio">
          <input
            type="text"
            placeholder="Ej. A"
            value={edificio}
            onChange={(e) => setEdificio(e.target.value)}
            className="input"
          />
        </Campo>

        <Campo etiqueta="Ubicación / planta">
          <select value={planta} onChange={(e) => setPlanta(e.target.value)} className="input">
            {PLANTAS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta="Locker inicial">
          <input
            type="number"
            value={numeroInicio}
            onChange={(e) => setNumeroInicio(e.target.value)}
            className="input"
          />
        </Campo>

        <Campo etiqueta="Locker final">
          <input
            type="number"
            value={numeroFin}
            onChange={(e) => setNumeroFin(e.target.value)}
            className="input"
          />
        </Campo>
      </div>

      <button
        onClick={generarPropuesta}
        disabled={cargando}
        className="mb-6 rounded-md bg-panel-800 px-4 py-2 text-sm font-medium text-white hover:bg-panel-700 disabled:opacity-60"
      >
        {cargando ? 'Generando...' : 'Generar propuesta de asignación'}
      </button>

      {mensaje && <p className="mb-4 text-sm text-panel-700">{mensaje}</p>}

      {sinLocker.length > 0 && (
        <p className="mb-4 text-sm text-alert">
          {sinLocker.length} alumnos no tienen locker disponible en este rango. Amplía
          el rango o genera otra ubicación para ellos.
        </p>
      )}

      {filas.length > 0 && (
        <>
          <div className="mb-4 overflow-x-auto rounded-md border border-panel-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-panel-100 text-panel-600">
                <tr>
                  <Th>Alumno</Th>
                  <Th>Matrícula</Th>
                  <Th>Locker propuesto</Th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f, i) => (
                  <tr key={f.alumno.id} className="border-t border-panel-100">
                    <Td>{f.alumno.nombre}</Td>
                    <Td>{f.alumno.matricula}</Td>
                    <Td>
                      <select
                        value={f.locker.id}
                        onChange={(e) => cambiarLockerDeFila(i, e.target.value)}
                        className="input"
                      >
                        {lockersUbicacion.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.edificio}-{l.planta}-{l.numero}
                          </option>
                        ))}
                      </select>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={confirmarYGuardar}
            disabled={guardando}
            className="rounded-md bg-ok px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {guardando ? 'Guardando...' : `Confirmar y guardar ${filas.length} asignaciones`}
          </button>
        </>
      )}
    </div>
  )
}

function Campo({ etiqueta, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-panel-600">{etiqueta}</span>
      {children}
    </label>
  )
}
function Th({ children }) {
  return <th className="px-3 py-2 font-medium">{children}</th>
}
function Td({ children }) {
  return <td className="px-3 py-2">{children}</td>
}
