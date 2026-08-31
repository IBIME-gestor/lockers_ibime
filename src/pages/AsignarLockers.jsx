import { useEffect, useState } from 'react'
import { obtenerAlumnos, obtenerAlumnosPorGrupo } from '../services/students'
import {
  generarRangoLockers,
  obtenerLockersPorUbicacion,
  guardarAsignaciones,
} from '../services/lockers'
import { generarPropuestaAsignacion } from '../utils/assignmentAlgorithm'
import { formatoLocker } from '../utils/lockerFormat'
import { useAuth } from '../context/AuthContext'

const PLANTAS = ['Planta baja', 'Primer piso', 'Segundo piso']

export default function AsignarLockers() {
  const { perfil } = useAuth()

  const [tipoFiltro, setTipoFiltro] = useState('grupoEspanol')
  const [valorGrupo, setValorGrupo] = useState('')

  const [gruposDisponibles, setGruposDisponibles] = useState([])
  const [cargandoGrupos, setCargandoGrupos] = useState(true)

  const [edificio, setEdificio] = useState('A')
  const [planta, setPlanta] = useState(PLANTAS[0])
  const [numeroInicio, setNumeroInicio] = useState('')
  const [numeroFin, setNumeroFin] = useState('')

  const [alumnosFiltrados, setAlumnosFiltrados] = useState(null)
  const [lockersUbicacion, setLockersUbicacion] = useState([])
  const [filas, setFilas] = useState([])
  const [sinLocker, setSinLocker] = useState([])

  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)

  /*
   * Carga automáticamente los grupos existentes en Firebase.
   *
   * grupoEspanol -> grupos de español
   * grupoIngles  -> grupos de inglés
   */
  useEffect(() => {
    async function cargarGrupos() {
      setCargandoGrupos(true)
      setValorGrupo('')
      setMensaje('')

      try {
        const alumnos = await obtenerAlumnos()

        let grupos = [
          ...new Set(
            alumnos
              .map((alumno) => alumno[tipoFiltro])
              .filter(
                (grupo) =>
                  grupo !== undefined &&
                  grupo !== null &&
                  String(grupo).trim() !== ''
              )
              .map((grupo) => String(grupo).trim())
          ),
        ]

        grupos.sort((a, b) =>
          a.localeCompare(b, undefined, {
            numeric: true,
            sensitivity: 'base',
          })
        )

        /*
         * Los tutores solo pueden trabajar con sus grupos.
         *
         * Ejemplo:
         * grupos: ['1 aqua', '1 beta']
         */
        if (perfil?.rol === 'tutor') {
          const gruposTutor = Array.isArray(perfil.grupos)
            ? perfil.grupos.map((g) => String(g).trim())
            : []

          grupos = grupos.filter((grupo) =>
            gruposTutor.includes(grupo)
          )
        }

        setGruposDisponibles(grupos)
      } catch (error) {
        console.error('Error cargando grupos:', error)
        setGruposDisponibles([])
        setMensaje('No se pudieron cargar los grupos desde Firebase.')
      } finally {
        setCargandoGrupos(false)
      }
    }

    cargarGrupos()
  }, [tipoFiltro, perfil])

  async function generarPropuesta() {
    if (!valorGrupo || !numeroInicio || !numeroFin) {
      setMensaje(
        'Completa el grupo y el rango de lockers antes de continuar.'
      )
      return
    }

    const inicio = Number(numeroInicio)
    const fin = Number(numeroFin)

    if (Number.isNaN(inicio) || Number.isNaN(fin)) {
      setMensaje('Los números de locker deben ser válidos.')
      return
    }

    if (inicio > fin) {
      setMensaje(
        'El locker inicial no puede ser mayor que el locker final.'
      )
      return
    }

    setMensaje('')
    setCargando(true)

    try {
      /*
       * Obtener alumnos del grupo seleccionado.
       */
      const alumnos = await obtenerAlumnosPorGrupo(
        tipoFiltro,
        valorGrupo
      )

      if (alumnos.length === 0) {
        setMensaje(
          `No se encontraron alumnos en el grupo "${valorGrupo}".`
        )

        setAlumnosFiltrados([])
        setFilas([])
        setSinLocker([])
        return
      }

      setAlumnosFiltrados(alumnos)

      /*
       * Crear lockers si todavía no existen.
       */
      await generarRangoLockers(
        edificio,
        planta,
        inicio,
        fin
      )

      /*
       * Obtener lockers de la ubicación.
       */
      const lockers = await obtenerLockersPorUbicacion(
        edificio,
        planta
      )

      const lockersEnRango = lockers.filter(
        (locker) =>
          locker.numero >= inicio &&
          locker.numero <= fin
      )

      setLockersUbicacion(lockersEnRango)

      /*
       * Generar propuesta automática.
       */
      const resultado = generarPropuestaAsignacion(
        alumnos,
        lockersEnRango
      )

      setFilas(resultado.propuesta)
      setSinLocker(resultado.sinLocker)
    } catch (error) {
      console.error('Error generando propuesta:', error)

      setMensaje(
        'Ocurrió un error al generar la propuesta.'
      )

      setFilas([])
      setSinLocker([])
    } finally {
      setCargando(false)
    }
  }

  /*
   * Cambiar locker manualmente.
   *
   * Si el locker ya está asignado a otra fila de la propuesta,
   * se intercambian los lockers.
   */
  function cambiarLockerDeFila(indice, nuevoLockerId) {
    setFilas((prev) => {
      const nuevoLocker = lockersUbicacion.find(
        (locker) => locker.id === nuevoLockerId
      )

      if (!nuevoLocker) return prev

      const copia = [...prev]

      const indiceConflicto = copia.findIndex(
        (fila, i) =>
          i !== indice &&
          fila.locker.id === nuevoLockerId
      )

      if (indiceConflicto !== -1) {
        const lockerAnterior = copia[indice].locker

        copia[indiceConflicto] = {
          ...copia[indiceConflicto],
          locker: lockerAnterior,
        }
      }

      copia[indice] = {
        ...copia[indice],
        locker: nuevoLocker,
      }

      return copia
    })
  }

  /*
   * Guardar definitivamente las asignaciones.
   */
  async function confirmarYGuardar() {
    if (filas.length === 0) {
      setMensaje('No hay asignaciones para guardar.')
      return
    }

    setGuardando(true)
    setMensaje('')

    try {
      await guardarAsignaciones(
        filas.map((fila) => ({
          alumno: {
            matricula: fila.alumno.matricula,
            nombre: fila.alumno.nombre,
          },
          locker: fila.locker,
        }))
      )

      setMensaje(
        `Se guardaron ${filas.length} asignaciones correctamente.`
      )

      setFilas([])
      setAlumnosFiltrados(null)
    } catch (error) {
      console.error('Error guardando asignaciones:', error)

      setMensaje(
        'Ocurrió un error al guardar las asignaciones.'
      )
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-semibold text-panel-900">
        Asignar lockers
      </h1>

      <p className="mb-6 text-panel-500">
        Filtra un grupo, define la ubicación y el rango de lockers a entregar,
        y revisa la propuesta antes de guardarla.
      </p>

      {/* FILTROS */}
      <div className="mb-6 grid grid-cols-1 gap-4 rounded-md border border-panel-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">

        {/* TIPO DE GRUPO */}
        <Campo etiqueta="Filtrar por">
          <select
            value={tipoFiltro}
            onChange={(e) => {
              setTipoFiltro(e.target.value)
              setValorGrupo('')
              setFilas([])
              setSinLocker([])
              setMensaje('')
            }}
            className="input"
          >
            <option value="grupoEspanol">
              Grupo de español
            </option>

            <option value="grupoIngles">
              Grupo de inglés
            </option>
          </select>
        </Campo>

        {/* GRUPO */}
        <Campo etiqueta="Grupo">
          <select
            value={valorGrupo}
            onChange={(e) => setValorGrupo(e.target.value)}
            disabled={cargandoGrupos}
            className="input disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">
              {cargandoGrupos
                ? 'Cargando grupos...'
                : gruposDisponibles.length === 0
                  ? 'No hay grupos disponibles'
                  : 'Selecciona un grupo...'}
            </option>

            {gruposDisponibles.map((grupo) => (
              <option
                key={grupo}
                value={grupo}
              >
                {grupo}
              </option>
            ))}
          </select>
        </Campo>

        {/* EDIFICIO */}
        <Campo etiqueta="Edificio">
          <input
            type="text"
            placeholder="Ej. A"
            value={edificio}
            onChange={(e) =>
              setEdificio(e.target.value.toUpperCase())
            }
            className="input"
          />
        </Campo>

        {/* PLANTA */}
        <Campo etiqueta="Ubicación / planta">
          <select
            value={planta}
            onChange={(e) => setPlanta(e.target.value)}
            className="input"
          >
            {PLANTAS.map((p) => (
              <option
                key={p}
                value={p}
              >
                {p}
              </option>
            ))}
          </select>
        </Campo>

        {/* LOCKER INICIAL */}
        <Campo etiqueta="Locker inicial">
          <input
            type="number"
            min="1"
            value={numeroInicio}
            onChange={(e) =>
              setNumeroInicio(e.target.value)
            }
            className="input"
          />
        </Campo>

        {/* LOCKER FINAL */}
        <Campo etiqueta="Locker final">
          <input
            type="number"
            min="1"
            value={numeroFin}
            onChange={(e) =>
              setNumeroFin(e.target.value)
            }
            className="input"
          />
        </Campo>
      </div>

      {/* GENERAR */}
      <button
        onClick={generarPropuesta}
        disabled={
          cargando ||
          cargandoGrupos ||
          !valorGrupo ||
          !numeroInicio ||
          !numeroFin
        }
        className="mb-6 rounded-md bg-panel-800 px-4 py-2 text-sm font-medium text-white hover:bg-panel-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {cargando
          ? 'Generando...'
          : 'Generar propuesta de asignación'}
      </button>

      {/* MENSAJE */}
      {mensaje && (
        <p className="mb-4 text-sm text-panel-700">
          {mensaje}
        </p>
      )}

      {/* SIN LOCKER */}
      {sinLocker.length > 0 && (
        <p className="mb-4 text-sm text-alert">
          {sinLocker.length} alumnos no tienen locker disponible
          en este rango. Amplía el rango o genera otra ubicación.
        </p>
      )}

      {/* PROPUESTA */}
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
                {filas.map((fila, indice) => (
                  <tr
                    key={fila.alumno.id}
                    className="border-t border-panel-100"
                  >
                    <Td>
                      {fila.alumno.nombre}
                    </Td>

                    <Td>
                      {fila.alumno.matricula}
                    </Td>

                    <Td>
                      <select
                        value={fila.locker.id}
                        onChange={(e) =>
                          cambiarLockerDeFila(
                            indice,
                            e.target.value
                          )
                        }
                        className="input"
                      >
                        {lockersUbicacion.map((locker) => (
                          <option
                            key={locker.id}
                            value={locker.id}
                          >
                            {formatoLocker(locker)}
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
            className="rounded-md bg-ok px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando
              ? 'Guardando...'
              : `Confirmar y guardar ${filas.length} asignaciones`}
          </button>
        </>
      )}
    </div>
  )
}

function Campo({ etiqueta, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-panel-600">
        {etiqueta}
      </span>

      {children}
    </label>
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
