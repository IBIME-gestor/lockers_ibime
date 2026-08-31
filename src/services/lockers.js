import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'

const COL = 'lockers'

// ID de documento determinístico: evita duplicar el mismo locker físico.
function idLocker(edificio, planta, numero) {
  return `${edificio}-${planta}-${numero}`
}

// Estructura de cada documento de locker:
// {
//   edificio, planta, numero,
//   ocupado: boolean,
//   alumnoMatricula: string | null,
//   alumnoNombre: string | null,
// }

// Crea (si no existen) los lockers de un rango numérico en una ubicación.
// Es seguro llamarla varias veces: no sobreescribe lockers ya ocupados.
export async function generarRangoLockers(edificio, planta, numeroInicio, numeroFin) {
  const existentes = await obtenerLockersPorUbicacion(edificio, planta)
  const existentesSet = new Set(existentes.map((l) => l.numero))

  const batch = writeBatch(db)
  for (let n = numeroInicio; n <= numeroFin; n++) {
    if (existentesSet.has(n)) continue
    const ref = doc(db, COL, idLocker(edificio, planta, n))
    batch.set(ref, {
      edificio,
      planta,
      numero: n,
      ocupado: false,
      alumnoMatricula: null,
      alumnoNombre: null,
    })
  }
  await batch.commit()
}

export async function obtenerLockersPorUbicacion(edificio, planta) {
  const q = query(
    collection(db, COL),
    where('edificio', '==', edificio),
    where('planta', '==', planta)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Guarda en una sola tanda la asignación confirmada: marca cada locker como
// ocupado y actualiza el registro del alumno correspondiente.
export async function guardarAsignaciones(asignaciones) {
  // asignaciones: [{ alumno: {id, nombre, matricula}, locker: {id, edificio, planta, numero} }]
  const CHUNK = 200 // cada asignación toca 2 documentos -> 400 writes por batch
  for (let i = 0; i < asignaciones.length; i += CHUNK) {
    const batch = writeBatch(db)
    const trozo = asignaciones.slice(i, i + CHUNK)
    trozo.forEach(({ alumno, locker }) => {
      const lockerRef = doc(db, COL, locker.id)
      batch.update(lockerRef, {
        ocupado: true,
        alumnoMatricula: alumno.matricula,
        alumnoNombre: alumno.nombre,
      })
      const alumnoRef = doc(db, 'alumnos', String(alumno.matricula))
      batch.update(alumnoRef, {
        lockerAsignado: {
          numero: locker.numero,
          edificio: locker.edificio,
          planta: locker.planta,
        },
      })
    })
    await batch.commit()
  }
}

// Libera un locker (por si se necesita reasignar o corregir un error).
export async function liberarLocker(lockerId, matriculaAlumno) {
  const batch = writeBatch(db)
  batch.update(doc(db, COL, lockerId), {
    ocupado: false,
    alumnoMatricula: null,
    alumnoNombre: null,
  })
  if (matriculaAlumno) {
    batch.update(doc(db, 'alumnos', String(matriculaAlumno)), {
      lockerAsignado: null,
    })
  }
  await batch.commit()
}
