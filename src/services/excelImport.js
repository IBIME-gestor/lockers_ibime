import * as XLSX from 'xlsx'

// Alias aceptados por columna (sin acentos, en minúsculas).
const ALIAS = {
  matricula: ['matricula', 'no. control', 'no control', 'id'],
  nombre: ['nombre', 'nombre del alumno', 'alumno'],
  correoAlumno: [
    'correo alumno',
    'correo del alumno',
    'correo alumno institucional',
    'email alumno',
    'email del alumno',
    'correo',
    'email',
  ],
  tutorNombre: ['tutor', 'nombre del tutor', 'nombre tutor'],
  grupoEspanol: ['grupo de espanol', 'grupo espanol', 'grupo'],
  grupoIngles: ['grupo de ingles', 'grupo ingles', 'nivel de ingles'],
}

function normalizar(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function encontrarClave(headerNormalizado) {
  for (const [campo, alias] of Object.entries(ALIAS)) {
    if (alias.includes(headerNormalizado)) return campo
  }
  return null
}

// Recibe un File (input type="file") y regresa { alumnos, errores }
export async function parsearExcelAlumnos(archivo) {
  const buffer = await archivo.arrayBuffer()
  const libro = XLSX.read(buffer, { type: 'array' })
  const hoja = libro.Sheets[libro.SheetNames[0]]
  const filas = XLSX.utils.sheet_to_json(hoja, { defval: '' })

  if (filas.length === 0) {
    return {
      alumnos: [],
      errores: ['El archivo no contiene filas de datos.'],
    }
  }

  // Mapear encabezados de la primera fila a nuestros campos internos
  const encabezados = Object.keys(filas[0])
  const mapa = {}

  encabezados.forEach((h) => {
    const campo = encontrarClave(normalizar(h))
    if (campo) mapa[h] = campo
  })

  // Columnas obligatorias
  const requeridos = [
    'matricula',
    'nombre',
    'correoAlumno',
    'grupoEspanol',
    'grupoIngles',
    'tutorNombre',
  ]

  const encontrados = new Set(Object.values(mapa))
  const faltantes = requeridos.filter((r) => !encontrados.has(r))

  const errores = []

  if (faltantes.length > 0) {
    errores.push(
      `No se encontraron las columnas: ${faltantes.join(
        ', '
      )}. Verifica los encabezados del Excel.`
    )

    return {
      alumnos: [],
      errores,
    }
  }

  const alumnos = filas
    .map((fila, i) => {
      const alumno = {}

      Object.entries(mapa).forEach(([header, campo]) => {
        alumno[campo] = String(fila[header]).trim()
      })

      alumno.lockerAsignado = null

      if (!alumno.matricula) {
        errores.push(`Fila ${i + 2}: falta la matrícula, se omitió.`)
        return null
      }

      return alumno
    })
    .filter(Boolean)

  return {
    alumnos,
    errores,
  }
}
