// Algoritmo de asignación automática: es una propuesta editable, no una
// escritura definitiva. Empareja alumnos (ya filtrados por grupo) con
// lockers disponibles de la ubicación elegida, en orden alfabético por
// nombre para que la asignación sea predecible y fácil de revisar.

export function generarPropuestaAsignacion(alumnos, lockersDisponibles) {
  const alumnosOrdenados = [...alumnos]
    .filter((a) => !a.lockerAsignado)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  const lockersOrdenados = [...lockersDisponibles]
    .filter((l) => !l.ocupado)
    .sort((a, b) => a.numero - b.numero)

  const propuesta = []
  const sinLocker = []

  alumnosOrdenados.forEach((alumno, i) => {
    const locker = lockersOrdenados[i]
    if (locker) {
      propuesta.push({ alumno, locker })
    } else {
      sinLocker.push(alumno)
    }
  })

  const lockersSobrantes = lockersOrdenados.slice(alumnosOrdenados.length)

  return { propuesta, sinLocker, lockersSobrantes }
}
