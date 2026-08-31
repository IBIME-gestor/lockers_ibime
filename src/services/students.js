import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'

const COL = 'alumnos'

// Estructura de cada documento de alumno:
// {
//   matricula, nombre, tutorNombre,
//   grupoEspanol, grupoIngles,
//   lockerAsignado: null | { numero, edificio, planta }
// }

export async function obtenerAlumnos() {
  const snap = await getDocs(collection(db, COL))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function obtenerAlumnosPorGrupo(campo, valor) {
  // campo: 'grupoEspanol' | 'grupoIngles'
  const q = query(collection(db, COL), where(campo, '==', valor))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Guarda en lote la lista de alumnos importada desde Excel.
// Usa la matrícula como ID de documento para evitar duplicados en reimportaciones.
export async function importarAlumnos(alumnos) {
  const CHUNK = 400 // límite seguro por batch de Firestore (500)
  for (let i = 0; i < alumnos.length; i += CHUNK) {
    const batch = writeBatch(db)
    const trozo = alumnos.slice(i, i + CHUNK)
    trozo.forEach((alumno) => {
      const ref = doc(db, COL, String(alumno.matricula))
      batch.set(ref, alumno, { merge: true })
    })
    await batch.commit()
  }
}
