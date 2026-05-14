// src/pages/admin/PanelAdmin.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../../components/layout/Sidebar'

export default function PanelAdmin() {
  const navigate = useNavigate()
  const { perfil, cerrarSesion } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [vista, setVista] = useState('lista')

  const [form, setForm] = useState({
    nombre: '', apellido: '', telefono: '', email: '', password: '', rol: 'recepcionista',
  })
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')
  const [exito, setExito] = useState('')

  useEffect(() => { cargarUsuarios() }, [])

  async function cargarUsuarios() {
    setCargando(true)
    const { data, error } = await supabase.from('perfiles').select('*').order('created_at', { ascending: false })
    if (error) setError('Error al cargar usuarios')
    else setUsuarios(data)
    setCargando(false)
  }

  async function cambiarRol(id, nuevoRol) {
    const { error } = await supabase.from('perfiles').update({ rol: nuevoRol }).eq('id', id)
    if (error) alert('Error al cambiar rol')
    else cargarUsuarios()
  }

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }) }

  function validarFormulario() {
    if (form.telefono && form.telefono.length !== 9) return 'El teléfono debe tener exactamente 9 dígitos.'
    if (form.telefono && !/^\d+$/.test(form.telefono)) return 'El teléfono solo debe contener números.'
    if (form.password.length < 8) return 'La contraseña debe tener mínimo 8 caracteres.'
    if (!/[A-Z]/.test(form.password)) return 'Debe contener al menos una mayúscula.'
    if (!/\d.*\d/.test(form.password)) return 'Debe contener al menos 2 números.'
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password)) return 'Debe contener al menos un carácter especial.'
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
    if (errorValidacion) { setErrorForm(errorValidacion); return }
    setGuardando(true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            nombre: form.nombre,
            apellido: form.apellido,
            telefono: form.telefono,
            rol: form.rol,
          }),
          signal: controller.signal,
        }
      )

      clearTimeout(timeoutId)
      const data = await res.json()

      if (!res.ok || data.error) {
        setErrorForm(data.error || 'Error al crear usuario')
        return
      }

      setExito('✅ Usuario creado correctamente')
      setForm({ nombre: '', apellido: '', telefono: '', email: '', password: '', rol: 'recepcionista' })
      setVista('lista')
      setTimeout(() => cargarUsuarios(), 500)

    } catch (err) {
      if (err.name === 'AbortError') {
        setErrorForm('La operación tardó demasiado. Intenta de nuevo.')
      } else {
        setErrorForm('Error inesperado: ' + err.message)
      }
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

  const resumenRoles = ['administrador', 'recepcionista', 'odontologo', 'paciente']

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar rol="administrador" />

      <div className="flex-1 ml-64">

        {/* Header */}
        <div className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Panel Administrador</h1>
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {perfil?.avatar_url ? (
              <img src={perfil.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full object-cover border-2 border-purple-500" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {perfil?.nombre?.charAt(0)}{perfil?.apellido?.charAt(0)}
              </div>
            )}
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">¡Hola, {perfil?.nombre}! 👋</p>
              <p className="text-xs text-gray-400 capitalize">{perfil?.rol}</p>
            </div>
            <button
              onClick={cerrarSesion}
              className="border border-red-400 text-red-500 hover:bg-red-50 hover:border-red-500 text-xs font-medium px-3 py-1.5 rounded-lg transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-r from-purple-700 to-purple-900 text-white px-8 py-10">
          <h2 className="text-3xl font-bold mb-1">Bienvenido, {perfil?.nombre} 👋</h2>
          <p className="text-purple-200">Administra usuarios, pacientes y citas del sistema</p>
        </div>

        <div className="px-8 py-8">

          {/* Resumen por roles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {resumenRoles.map((rol) => (
              <div key={rol} className="bg-white rounded-2xl shadow-sm p-5 text-center">
                <p className="text-3xl font-bold text-gray-800">
                  {usuarios.filter(u => u.rol === rol).length}
                </p>
                <p className="text-sm text-gray-500 capitalize mt-1">{rol}s</p>
              </div>
            ))}
          </div>

          {/* Accesos rápidos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => navigate('/pacientes', { state: { from: '/admin' } })}
              className="bg-white rounded-2xl shadow-sm p-6 text-left hover:shadow-md transition border-l-4 border-green-500 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-3xl">🏥</div>
                <div>
                  <p className="text-lg font-bold text-gray-800">Ver Pacientes</p>
                  <p className="text-sm text-gray-500">Consultar registro de pacientes</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => navigate('/citas', { state: { from: '/admin' } })}
              className="bg-white rounded-2xl shadow-sm p-6 text-left hover:shadow-md transition border-l-4 border-blue-500 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl">📅</div>
                <div>
                  <p className="text-lg font-bold text-gray-800">Ver Citas</p>
                  <p className="text-sm text-gray-500">Consultar todas las citas</p>
                </div>
              </div>
            </button>
          </div>

          {/* Gestión de usuarios */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-800">👥 Gestión de Usuarios</h3>
              <button
                onClick={() => setVista(vista === 'nuevo' ? 'lista' : 'nuevo')}
                className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
              >
                {vista === 'nuevo' ? '✕ Cancelar' : '+ Crear staff'}
              </button>
            </div>

            {/* Formulario crear staff */}
            {vista === 'nuevo' && (
              <div className="p-6 border-b bg-gray-50">
                {errorForm && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm mb-4">{errorForm}</div>}
                {exito && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm mb-4">{exito}</div>}

                <form onSubmit={handleCrearStaff} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input name="nombre" value={form.nombre} onChange={handleChange} required placeholder="Ingrese el nombre"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                      <input name="apellido" value={form.apellido} onChange={handleChange} required placeholder="Ingrese el apellido"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="9 dígitos"
                        inputMode="numeric" maxLength={9}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                      <select name="rol" value={form.rol} onChange={handleChange}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white">
                        <option value="recepcionista">Recepcionista</option>
                        <option value="odontologo">Odontólogo</option>
                        <option value="administrador">Administrador</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="correo@ejemplo.com"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña temporal</label>
                    <input type="password" name="password" value={form.password} onChange={handleChange} required
                      placeholder="Mínimo 8 caracteres, mayúscula, número y símbolo"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white" />
                    {form.password && (
                      <div className="mt-2 space-y-1">
                        {[
                          [form.password.length >= 8, 'Mínimo 8 caracteres'],
                          [/[A-Z]/.test(form.password), 'Al menos una mayúscula'],
                          [/\d.*\d/.test(form.password), 'Al menos 2 números'],
                          [/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password), 'Al menos un carácter especial'],
                        ].map(([ok, label]) => (
                          <p key={label} className={`text-xs flex items-center gap-1 ${ok ? 'text-green-600' : 'text-red-500'}`}>
                            {ok ? '✅' : '❌'} {label}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <button type="submit" disabled={guardando}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50">
                    {guardando ? 'Creando...' : 'Crear usuario'}
                  </button>
                </form>
              </div>
            )}

            {/* Tabla usuarios */}
            {cargando ? (
              <p className="text-center text-gray-400 py-8 animate-pulse">Cargando usuarios...</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 text-gray-600">Nombre</th>
                    <th className="text-left px-6 py-3 text-gray-600">Teléfono</th>
                    <th className="text-left px-6 py-3 text-gray-600">Rol actual</th>
                    <th className="text-left px-6 py-3 text-gray-600">Cambiar rol</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-800">{u.nombre} {u.apellido}</td>
                      <td className="px-6 py-4 text-gray-600">{u.telefono || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${coloresPorRol[u.rol]}`}>
                          {u.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select value={u.rol} onChange={(e) => cambiarRol(u.id, e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
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
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-6 px-8 mt-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span>🦷</span>
              <span className="text-white font-semibold">DentaNovax</span>
            </div>
            <p>© 2026 DentaNovax. Todos los derechos reservados.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}