import { useState } from 'react'
import {
  obtenerLockersPorUbicacion,
  liberarLocker,
} from '../services/lockers'
import { formatoLocker } from '../utils/lockerFormat'
import { useAuth } from '../context/AuthContext'

const PLANTAS = [
  'Planta baja',
  'Primer piso',
  'Segundo piso',
]

export default function Lockers() {
  const { perfil } = useAuth()

  const [edificio, setEdificio] = useState('A')
  const [planta, setPlanta] = useState(PLANTAS[0])
  const [lockers, setLockers] = useState([])
  const [cargando, setCargando] = useState(false)

  const puedeLiberar =
    perfil?.rol === 'administrador' ||
    perfil?.rol === 'supervisor'

  async function buscar() {
    setCargando(true)

    try {
      const datos = await obtenerLockersPorUbicacion(
        edificio,
        planta
      )

      setLockers(
        datos.sort(
          (a, b) => a.numero - b.numero
        )
      )
    } finally {
      setCargando(false)
    }
  }

  async function manejarLiberar(locker) {
    const nombreLocker = formatoLocker(locker)

    if (
      !confirm(
        `¿Liberar el locker ${nombreLocker}?`
      )
    ) {
      return
    }

    await liberarLocker(
      locker.id,
      locker.alumnoMatricula
    )

    buscar()
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-semibold text-panel-900">
        Mapa de lockers
      </h1>

      <p className="mb-6 text-panel-500">
        Consulta la ocupación por edificio y planta.
      </p>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-sm text-panel-600">
            Edificio
          </span>

          <input
            type="text"
            value={edificio}
            onChange={(e) =>
              setEdificio(
                e.target.value.toUpperCase()
              )
            }
            className="input w-28"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-panel-600">
            Ubicación / planta
          </span>

          <select
            value={planta}
            onChange={(e) =>
              setPlanta(e.target.value)
            }
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
        </label>

        <button
          onClick={buscar}
          className="rounded-md bg-panel-800 px-4 py-2 text-sm font-medium text-white hover:bg-panel-700"
        >
          Consultar
        </button>
      </div>

      {cargando ? (
        <p className="text-panel-500">
          Cargando...
        </p>
      ) : lockers.length > 0 ? (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
          {lockers.map((locker) => (
            <div
              key={locker.id}
              className={`rounded-md border p-3 text-center text-xs ${
                locker.ocupado
                  ? 'border-brass-500 bg-brass-400/10'
                  : 'border-panel-200 bg-white'
              }`}
            >
              <p className="font-display font-semibold text-panel-900">
                {formatoLocker(locker)}
              </p>

              {locker.ocupado ? (
                <>
                  <p className="mt-1 truncate text-panel-600">
                    {locker.alumnoNombre}
                  </p>

                  {puedeLiberar && (
                    <button
                      onClick={() =>
                        manejarLiberar(locker)
                      }
                      className="mt-1 text-alert underline"
                    >
                      Liberar
                    </button>
                  )}
                </>
              ) : (
                <p className="mt-1 text-panel-400">
                  Libre
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-panel-400">
          Sin resultados. Realiza una búsqueda.
        </p>
      )}
    </div>
  )
}
