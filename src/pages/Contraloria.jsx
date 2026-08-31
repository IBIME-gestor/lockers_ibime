import { useEffect, useMemo, useState } from 'react'
import { obtenerAlumnos } from '../services/students'
import { formatoLocker } from '../utils/lockerFormat'
import * as XLSX from 'xlsx'

export default function Contraloria() {
  const [alumnos, setAlumnos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    obtenerAlumnos()
      .then(setAlumnos)
      .finally(() => setCargando(false))
  }, [])

  const porGrupo = useMemo(() => {
    const mapa = {}

    alumnos.forEach((alumno) => {
      const key =
        alumno.grupoEspanol || 'Sin grupo'

      if (!mapa[key]) {
        mapa[key] = {
          total: 0,
          asignados: 0,
        }
      }

      mapa[key].total += 1

      if (alumno.lockerAsignado) {
        mapa[key].asignados += 1
      }
    })

    return Object.entries(mapa).sort(
      ([a], [b]) =>
        a.localeCompare(b, 'es')
    )
  }, [alumnos])

  function exportarExcel() {
    const filas = alumnos.map((alumno) => ({
      Matricula: alumno.matricula,
      Nombre: alumno.nombre,
      'Correo alumno': alumno.correoAlumno ?? '',
      'Grupo español': alumno.grupoEspanol,
      'Grupo inglés': alumno.grupoIngles,
      Tutor: alumno.tutorNombre,

      Locker: formatoLocker(
        alumno.lockerAsignado
      ),
    }))

    const hoja =
      XLSX.utils.json_to_sheet(filas)

    const libro =
      XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(
      libro,
      hoja,
      'Asignaciones'
    )

    XLSX.writeFile(
      libro,
      'asignacion-lockers.xlsx'
    )
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-semibold text-panel-900">
        Contraloría / Reportes
      </h1>

      <p className="mb-6 text-panel-500">
        Vista de solo lectura para auditar el avance
        de la asignación por grupo.
      </p>

      <button
        onClick={exportarExcel}
        className="mb-6 rounded-md border border-panel-300 bg-white px-4 py-2 text-sm font-medium text-panel-700 hover:bg-panel-100"
      >
        Exportar reporte completo (.xlsx)
      </button>

      {cargando ? (
        <p className="text-panel-500">
          Cargando...
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-panel-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-panel-100 text-panel-600">
              <tr>
                <Th>Grupo</Th>
                <Th>Total alumnos</Th>
                <Th>Con locker</Th>
                <Th>Avance</Th>
              </tr>
            </thead>

            <tbody>
              {porGrupo.map(
                ([grupo, datos]) => (
                  <tr
                    key={grupo}
                    className="border-t border-panel-100"
                  >
                    <Td>{grupo}</Td>

                    <Td>
                      {datos.total}
                    </Td>

                    <Td>
                      {datos.asignados}
                    </Td>

                    <Td>
                      {Math.round(
                        (datos.asignados /
                          datos.total) *
                          100
                      )}
                      %
                    </Td>
                  </tr>
                )
              )}
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
