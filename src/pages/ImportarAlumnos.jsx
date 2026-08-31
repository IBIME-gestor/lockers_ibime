import { useState } from 'react'
import { parsearExcelAlumnos } from '../services/excelImport'
import { importarAlumnos } from '../services/students'

export default function ImportarAlumnos() {
  const [vistaPrevia, setVistaPrevia] = useState([])
  const [errores, setErrores] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  async function manejarArchivo(e) {
    const archivo = e.target.files[0]
    if (!archivo) return
    setGuardado(false)
    const { alumnos, errores } = await parsearExcelAlumnos(archivo)
    setVistaPrevia(alumnos)
    setErrores(errores)
  }

  async function confirmarImportacion() {
    setGuardando(true)
    try {
      await importarAlumnos(vistaPrevia)
      setGuardado(true)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-semibold text-panel-900">
        Importar lista de alumnos
      </h1>
      <p className="mb-6 text-panel-500">
        Sube el Excel con matrícula, nombre, grupo de español, grupo de inglés y
        nombre del tutor. Puedes volver a subir el archivo más adelante: los
        alumnos existentes se actualizan por matrícula, sin duplicarse.
      </p>

      <label className="mb-6 block w-fit cursor-pointer rounded-md border border-dashed border-panel-300 bg-white px-6 py-8 text-center text-sm text-panel-600 hover:border-panel-500">
        <input
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={manejarArchivo}
        />
        Haz clic para seleccionar el archivo .xlsx
      </label>

      {errores.length > 0 && (
        <div className="mb-6 rounded-md border border-alert/30 bg-alert/5 p-4 text-sm text-alert">
          <ul className="list-inside list-disc space-y-1">
            {errores.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {vistaPrevia.length > 0 && (
        <>
          <p className="mb-2 text-sm text-panel-600">
            {vistaPrevia.length} alumnos listos para importar. Vista previa de los
            primeros 10:
          </p>
          <div className="mb-4 overflow-x-auto rounded-md border border-panel-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-panel-100 text-panel-600">
                <tr>
                  <Th>Matrícula</Th>
                  <Th>Nombre</Th>
                  <Th>Grupo español</Th>
                  <Th>Grupo inglés</Th>
                  <Th>Tutor</Th>
                </tr>
              </thead>
              <tbody>
                {vistaPrevia.slice(0, 10).map((a) => (
                  <tr key={a.matricula} className="border-t border-panel-100">
                    <Td>{a.matricula}</Td>
                    <Td>{a.nombre}</Td>
                    <Td>{a.grupoEspanol}</Td>
                    <Td>{a.grupoIngles}</Td>
                    <Td>{a.tutorNombre}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={confirmarImportacion}
            disabled={guardando}
            className="rounded-md bg-panel-800 px-4 py-2 text-sm font-medium text-white hover:bg-panel-700 disabled:opacity-60"
          >
            {guardando ? 'Guardando...' : `Confirmar e importar ${vistaPrevia.length} alumnos`}
          </button>

          {guardado && (
            <p className="mt-3 text-sm text-ok">
              Importación completada correctamente.
            </p>
          )}
        </>
      )}
    </div>
  )
}

function Th({ children }) {
  return <th className="px-3 py-2 font-medium">{children}</th>
}
function Td({ children }) {
  return <td className="px-3 py-2">{children}</td>
}
