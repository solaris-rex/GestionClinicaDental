// src/pages/auth/Registro.jsx
// Página de registro de nuevos usuarios.
// Crea el usuario en Supabase Auth y luego guarda su perfil con rol en nuestra tabla.

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Registro() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    telefono: '',
    rol: 'paciente', // rol por defecto
  })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setCargando(true)

    // Paso 1: Crear usuario en Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({
    email: form.email,
    password: form.password,
  })

  if (authError) {
    setError('Error al registrar: ' + authError.message)
    setCargando(false)
    return
  }

// 🔥 Obtener usuario REAL desde sesión
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  if (!user) {
    setError('No se pudo obtener el usuario')
    setCargando(false)
    return
  }

    // Paso 2: Guardar perfil con rol en nuestra tabla 'perfiles'
    const { error: perfilError } = await supabase.from('perfiles').insert({
      id: data.user.id, // mismo ID que Supabase Auth
      nombre: form.nombre,
      apellido: form.apellido,
      telefono: form.telefono,
      rol: form.rol,
    })

    if (perfilError) {
      setError('Error al guardar perfil: ' + perfilError.message)
      setCargando(false)
      return
    }

    // Éxito: ir al dashboard
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-700">🦷 ClinicaDental</h1>
          <p className="text-gray-500 mt-1">Crea tu cuenta</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text" name="nombre" value={form.nombre}
                onChange={handleChange} required placeholder="Ingresa tu nombre"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
              <input
                type="text" name="apellido" value={form.apellido}
                onChange={handleChange} required placeholder="Ingresa tu apellido"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="text" name="telefono" value={form.telefono}
              onChange={handleChange} placeholder="Ingrese su número"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input
              type="email" name="email" value={form.email}
              onChange={handleChange} required placeholder="correo@ejemplo.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password" name="password" value={form.password}
              onChange={handleChange} required placeholder="Mínimo 6 caracteres"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              name="rol" value={form.rol} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="paciente">Paciente</option>
              <option value="recepcionista">Recepcionista</option>
              <option value="odontologo">Odontólogo</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>

          <button
            type="submit" disabled={cargando}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
          >
            {cargando ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>

      </div>
    </div>
  )
}