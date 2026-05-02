// src/pages/admin/PanelAdmin.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/layout/Navbar'

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
      return 'La contraseña debe contener al menos un carácter especial (!@#$%...).'
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
      // Guardar sesión actual del administrador
      const { data: sesionActual } = await supabase.auth.getSession()
      const tokenActual = sesionActual?.session?.access_token
      const refreshActual = sesionActual?.session?.refresh_token

      // Paso 1: Crear usuario en Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })

      if (authError) {
        // Restaurar sesión del admin aunque haya error
        if (tokenActual && refreshActual) {
          await supabase.auth.setSession({
            access_token: tokenActual,
            refresh_token: refreshActual,
          })
        }
        if (authError.message.includes('already registered')) {
          setErrorForm('Este correo ya está registrado.')
        } else {
          setErrorForm('Error al crear usuario: ' + authError.message)
        }
        setGuardando(false)
        return
      }

      const userId = data?.user?.id
      if (!userId) {
        if (tokenActual && refreshActual) {
          await supabase.auth.setSession({
            access_token: tokenActual,
            refresh_token: refreshActual,
          })
        }
        setErrorForm('No se pudo obtener el ID del usuario.')
        setGuardando(false)
        return
      }

      // Paso 2: Guardar perfil con reintentos
      const { error: perfilError } = await conReintentos(() =>
        supabase.from('perfiles').insert({
          id: userId,
          nombre: form.nombre,
          apellido: form.apellido,
          telefono: form.telefono,
          rol: form.rol,
        })
      )

      // Paso 3: Restaurar sesión del administrador
      if (tokenActual && refreshActual) {
        await supabase.auth.setSession({
          access_token: tokenActual,
          refresh_token: refreshActual,
        })
      }

      if (perfilError && perfilError.code !== '23505') {
        setErrorForm('Error al guardar perfil: ' + perfilError.message)
        setGuardando(false)
        return
      }

      const rolNombre = form.rol === 'recepcionista' ? 'Recepcionista'
        : form.rol === 'odontologo' ? 'Odontólogo'
        : 'Administrador'

      setExito(`✅ ${rolNombre} creado correctamente.`)
      setForm({ nombre: '', apellido: '', telefono: '', email: '', password: '', rol: 'recepcionista' })
      await cargarUsuarios()

    } catch (err) {
      setErrorForm('Ocurrió un error inesperado.')
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
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">👥 Gestión de Usuarios</h2>
          {vista === 'lista' && (
            <button
              onClick={() => { setVista('nuevo'); setExito(''); setErrorForm('') }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              + Crear staff
            </button>
          )}
        </div>

        {vista === 'nuevo' && (
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Crear nuevo usuario staff
            </h3>

            {errorForm && (
              <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">
                {errorForm}
              </div>
            )}
            {exito && (
              <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm mb-4">
                {exito}
              </div>
            )}

            <form onSubmit={handleCrearStaff} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text" name="nombre" value={form.nombre}
                    onChange={handleChange} required placeholder="Ingrese el nombre"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                  <input
                    type="text" name="apellido" value={form.apellido}
                    onChange={handleChange} required placeholder="Ingrese el apellido"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="text" name="telefono" value={form.telefono}
                    onChange={handleChange}
                    placeholder="9 dígitos"
                    inputMode="numeric"
                    maxLength={9}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <select
                    name="rol" value={form.rol} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="recepcionista">Recepcionista</option>
                    <option value="odontologo">Odontólogo</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                <input
                  type="email" name="email" value={form.email}
                  onChange={handleChange} required placeholder="correo@ejemplo.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña temporal
                </label>
                <input
                  type="password" name="password" value={form.password}
                  onChange={handleChange} required
                  placeholder="Mínimo 8 caracteres, mayúscula, número y símbolo"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                {form.password && (
                  <div className="mt-2 space-y-1">
                    <p className={`text-xs flex items-center gap-1 ${form.password.length >= 8 ? 'text-green-600' : 'text-red-500'}`}>
                      {form.password.length >= 8 ? '✅' : '❌'} Mínimo 8 caracteres
                    </p>
                    <p className={`text-xs flex items-center gap-1 ${/[A-Z]/.test(form.password) ? 'text-green-600' : 'text-red-500'}`}>
                      {/[A-Z]/.test(form.password) ? '✅' : '❌'} Al menos una mayúscula
                    </p>
                    <p className={`text-xs flex items-center gap-1 ${/\d.*\d/.test(form.password) ? 'text-green-600' : 'text-red-500'}`}>
                      {/\d.*\d/.test(form.password) ? '✅' : '❌'} Al menos 2 números
                    </p>
                    <p className={`text-xs flex items-center gap-1 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password) ? 'text-green-600' : 'text-red-500'}`}>
                      {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password) ? '✅' : '❌'} Al menos un carácter especial
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit" disabled={guardando}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                >
                  {guardando ? 'Creando...' : 'Crear usuario'}
                </button>
                <button
                  type="button"
                  onClick={() => { setVista('lista'); setExito(''); setErrorForm('') }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg mb-4">{error}</div>
        )}

        {cargando ? (
          <p className="text-gray-500">Cargando usuarios...</p>
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 text-gray-600">Teléfono</th>
                  <th className="text-left px-4 py-3 text-gray-600">Rol actual</th>
                  <th className="text-left px-4 py-3 text-gray-600">Cambiar rol</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {u.nombre} {u.apellido}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.telefono || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${coloresPorRol[u.rol]}`}>
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.rol}
                        onChange={(e) => cambiarRol(u.id, e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      >
                        <option value="administrador">Administrador</option>
                        <option value="recepcionista">Recepcionista</option>
                        <option value="odontologo">Odontólogo</option>
                        <option value="paciente">Paciente</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {usuarios.length === 0 && (
              <p className="text-center text-gray-400 py-8">No hay usuarios registrados</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {['administrador', 'recepcionista', 'odontologo', 'paciente'].map((rol) => (
            <div key={rol} className="bg-white rounded-xl shadow p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">
                {usuarios.filter((u) => u.rol === rol).length}
              </p>
              <p className="text-sm text-gray-500 capitalize">{rol}s</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <button
            onClick={() => navigate('/pacientes')}
            className="bg-white hover:bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-left transition shadow"
          >
            <p className="text-3xl mb-2">🏥</p>
            <p className="text-lg font-semibold text-gray-800">Ver Pacientes</p>
            <p className="text-sm text-gray-500">Consultar registro de pacientes</p>
          </button>
          <button
            onClick={() => navigate('/citas')}
            className="bg-white hover:bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 text-left transition shadow"
          >
            <p className="text-3xl mb-2">📅</p>
            <p className="text-lg font-semibold text-gray-800">Ver Citas</p>
            <p className="text-sm text-gray-500">Consultar todas las citas del sistema</p>
          </button>
        </div>

      </div>
    </div>
  )
}