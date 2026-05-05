// src/pages/admin/PanelAdmin.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/layout/Sidebar'

export default function PanelAdmin() {
  const navigate = useNavigate()
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [vista, setVista] = useState('lista')

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    password: '',
    rol: 'recepcionista',
  })
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')
  const [exito, setExito] = useState('')

  useEffect(() => {
    cargarUsuarios()
  }, [])

  async function cargarUsuarios() {
    setCargando(true)
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) setError('Error al cargar usuarios')
    else setUsuarios(data)

    setCargando(false)
  }

  async function cambiarRol(id, nuevoRol) {
    const { error } = await supabase
      .from('perfiles')
      .update({ rol: nuevoRol })
      .eq('id', id)

    if (error) alert('Error al cambiar rol')
    else cargarUsuarios()
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function validarFormulario() {
    if (form.telefono && form.telefono.length !== 9) {
      return 'El teléfono debe tener exactamente 9 dígitos.'
    }
    if (form.telefono && !/^\d+$/.test(form.telefono)) {
      return 'El teléfono solo debe contener números.'
    }
    if (form.password.length < 8) {
      return 'La contraseña debe tener mínimo 8 caracteres.'
    }
    if (!/[A-Z]/.test(form.password)) {
      return 'La contraseña debe contener al menos una letra mayúscula.'
    }
    if (!/\d.*\d/.test(form.password)) {
      return 'La contraseña debe contener al menos 2 números.'
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password)) {
      return 'La contraseña debe contener al menos un carácter especial.'
    }
    return null
  }

  async function conReintentos(operacion, maxIntentos = 3, espera = 1000) {
    for (let intento = 1; intento <= maxIntentos; intento++) {
      try {
        const resultado = await operacion()
        if (!resultado.error) return resultado
        if (resultado.error.code === '23505') return resultado
        if (intento === maxIntentos) return resultado
        await new Promise(res => setTimeout(res, espera * intento))
      } catch (err) {
        if (intento === maxIntentos) throw err
        await new Promise(res => setTimeout(res, espera * intento))
      }
    }
  }

  async function handleCrearStaff(e) {
    e.preventDefault()
    setErrorForm('')
    setExito('')

    const errorValidacion = validarFormulario()
    if (errorValidacion) {
      setErrorForm(errorValidacion)
      return
    }

    setGuardando(true)

    try {
      const { data: sesionActual } = await supabase.auth.getSession()
      const tokenActual = sesionActual?.session?.access_token
      const refreshActual = sesionActual?.session?.refresh_token

      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })

      if (authError) {
        if (tokenActual && refreshActual) {
          await supabase.auth.setSession({
            access_token: tokenActual,
            refresh_token: refreshActual,
          })
        }
        setErrorForm(authError.message)
        setGuardando(false)
        return
      }

      const userId = data?.user?.id

      const { error: perfilError } = await conReintentos(() =>
        supabase.from('perfiles').insert({
          id: userId,
          nombre: form.nombre,
          apellido: form.apellido,
          telefono: form.telefono,
          rol: form.rol,
        })
      )

      if (tokenActual && refreshActual) {
        await supabase.auth.setSession({
          access_token: tokenActual,
          refresh_token: refreshActual,
        })
      }

      if (perfilError && perfilError.code !== '23505') {
        setErrorForm(perfilError.message)
        setGuardando(false)
        return
      }

      setExito('✅ Usuario creado correctamente')
      setForm({ nombre: '', apellido: '', telefono: '', email: '', password: '', rol: 'recepcionista' })
      cargarUsuarios()

    } catch {
      setErrorForm('Error inesperado')
    } finally {
      setGuardando(false)
    }
  }

  const coloresPorRol = {
    administrador: 'bg-purple-100 text-purple-700',
    recepcionista: 'bg-green-100 text-green-700',
    odontologo: 'bg-blue-100 text-blue-700',
    paciente: 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* Sidebar */}
      <Sidebar rol="administrador" />

      {/* Contenido */}
      <div className="flex-1 px-4 py-8 pt-16 md:pt-8 md:ml-64">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">👥 Gestión de Usuarios</h2>

          {vista === 'lista' && (
            <button
              onClick={() => setVista('nuevo')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
            >
              + Crear staff
            </button>
          )}
        </div>

        {vista === 'nuevo' && (
          <form onSubmit={handleCrearStaff} className="bg-white p-6 rounded-xl shadow space-y-4 mb-6">
            <input name="nombre" placeholder="Nombre" onChange={handleChange} value={form.nombre} className="w-full border p-2 rounded" />
            <input name="apellido" placeholder="Apellido" onChange={handleChange} value={form.apellido} className="w-full border p-2 rounded" />
            <input name="telefono" placeholder="Teléfono" onChange={handleChange} value={form.telefono} className="w-full border p-2 rounded" />
            <input name="email" placeholder="Correo" onChange={handleChange} value={form.email} className="w-full border p-2 rounded" />
            <input type="password" name="password" placeholder="Contraseña" onChange={handleChange} value={form.password} className="w-full border p-2 rounded" />

            <button disabled={guardando} className="bg-purple-600 text-white px-4 py-2 rounded">
              {guardando ? 'Creando...' : 'Crear'}
            </button>

            {errorForm && <p className="text-red-500 text-sm">{errorForm}</p>}
            {exito && <p className="text-green-600 text-sm">{exito}</p>}
          </form>
        )}

        {cargando ? (
          <p>Cargando...</p>
        ) : (
          <table className="w-full bg-white rounded-xl shadow text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Nombre</th>
                <th className="p-3 text-left">Teléfono</th>
                <th className="p-3 text-left">Rol</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-3">{u.nombre} {u.apellido}</td>
                  <td className="p-3">{u.telefono}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded ${coloresPorRol[u.rol]}`}>
                      {u.rol}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>
    </div>
  )
}