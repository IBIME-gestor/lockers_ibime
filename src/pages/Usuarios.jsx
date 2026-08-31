import { useEffect, useState } from 'react'
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

const ROLES = ['administrador', 'supervisor', 'tutor', 'contraloria']

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)

  const [nuevoUid, setNuevoUid] = useState('')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoCorreo, setNuevoCorreo] = useState('')
  const [nuevoRol, setNuevoRol] = useState('tutor')
  const [nuevoGrupos, setNuevoGrupos] = useState('')
  const [mensaje, setMensaje] = useState('')

  async function cargarUsuarios() {
    setCargando(true)
    const snap = await getDocs(collection(db, 'usuarios'))
    setUsuarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    setCargando(false)
  }

  useEffect(() => {
    cargarUsuarios()
  }, [])

  async function agregarPerfil(e) {
    e.preventDefault()
    if (!nuevoUid || !nuevoNombre || !nuevoCorreo) return
    await setDoc(doc(db, 'usuarios', nuevoUid), {
      nombre: nuevoNombre,
      correo: nuevoCorreo,
      rol: nuevoRol,
      grupos: nuevoRol === 'tutor' ? nuevoGrupos.split(',').map((g) => g.trim()).filter(Boolean) : [],
    })
    setMensaje('Perfil guardado.')
    setNuevoUid('')
    setNuevoNombre('')
    setNuevoCorreo('')
    setNuevoGrupos('')
    cargarUsuarios()
  }

  async function cambiarRol(uid, rol) {
    await updateDoc(doc(db, 'usuarios', uid), { rol })
    cargarUsuarios()
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-semibold text-panel-900">
        Usuarios y roles
      </h1>
      <p className="mb-6 max-w-2xl text-panel-500">
        El acceso es con la cuenta institucional de Google: pide a la persona
        que intente iniciar sesión una vez (verá "sin acceso", es normal),
        copia su UID desde Firebase Authentication → Users, y regístrala aquí
        para asignarle un rol dentro de la plataforma.
      </p>

      <form
        onSubmit={agregarPerfil}
        className="mb-8 grid grid-cols-1 gap-4 rounded-md border border-panel-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        <Campo etiqueta="UID de Firebase Auth">
          <input value={nuevoUid} onChange={(e) => setNuevoUid(e.target.value)} className="input" />
        </Campo>
        <Campo etiqueta="Nombre">
          <input value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} className="input" />
        </Campo>
        <Campo etiqueta="Correo">
          <input value={nuevoCorreo} onChange={(e) => setNuevoCorreo(e.target.value)} className="input" />
        </Campo>
        <Campo etiqueta="Rol">
          <select value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value)} className="input">
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </Campo>
        {nuevoRol === 'tutor' && (
          <Campo etiqueta="Grupos a cargo (separados por coma)">
            <input
              placeholder="1A, 1B"
              value={nuevoGrupos}
              onChange={(e) => setNuevoGrupos(e.target.value)}
              className="input"
            />
          </Campo>
        )}
        <div className="flex items-end">
          <button
            type="submit"
            className="rounded-md bg-panel-800 px-4 py-2 text-sm font-medium text-white hover:bg-panel-700"
          >
            Guardar perfil
          </button>
        </div>
      </form>

      {mensaje && <p className="mb-4 text-sm text-ok">{mensaje}</p>}

      {cargando ? (
        <p className="text-panel-500">Cargando...</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-panel-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-panel-100 text-panel-600">
              <tr>
                <Th>Nombre</Th>
                <Th>Correo</Th>
                <Th>Rol</Th>
                <Th>Grupos</Th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-t border-panel-100">
                  <Td>{u.nombre}</Td>
                  <Td>{u.correo}</Td>
                  <Td>
                    <select
                      value={u.rol}
                      onChange={(e) => cambiarRol(u.id, e.target.value)}
                      className="input"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </Td>
                  <Td>{u.grupos?.join(', ') || '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
