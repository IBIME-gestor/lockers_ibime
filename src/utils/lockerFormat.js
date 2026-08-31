export function abreviarPlanta(planta) {
  const abreviaturas = {
    'Planta baja': 'PB',
    'Primer piso': 'P1',
    'Segundo piso': 'P2',
  }

  return abreviaturas[planta] || planta || ''
}

export function formatoLocker(locker) {
  if (!locker) return ''

  return `${locker.numero}-${locker.edificio}-${abreviarPlanta(locker.planta)}`
}
