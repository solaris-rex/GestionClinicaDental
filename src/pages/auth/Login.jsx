// src/pages/auth/Login.jsx
// Página de inicio de sesión.
// Usa Supabase Auth para verificar el usuario y contraseña.

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const navigate = useNavigate()

  // Estado del formulario
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  // Actualizar campos del formulario
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Enviar formulario
  async function handleSubmit(e) {
  e.preventDefault()
  setError('')
  setCargando(true)

  // Timeout de seguridad: si tarda más de 8 segundos, libera el botón
  const timeout = setTimeout(() => {
    setCargando(false)
    setError('La conexión tardó demasiado. Intenta de nuevo.')
  }, 8000)

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    clearTimeout(timeout)

    if (error) {
      setError('Correo o contraseña incorrectos.')
      setCargando(false)
      return
    }

    if (data.user) {
      navigate('/dashboard')
    }
  } catch (err) {
    clearTimeout(timeout)
    setError('Ocurrió un error inesperado.')
    setCargando(false)
  }
}

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">

        {/* Encabezado */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-700">🦷 ClinicaDental</h1>
          <p className="text-gray-500 mt-1">Inicia sesión en tu cuenta</p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="correo@ejemplo.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
          >
            {cargando ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        {/* Link a registro */}
        <p className="text-center text-sm text-gray-500 mt-4">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-blue-600 hover:underline font-medium">
            Regístrate aquí
          </Link>
        </p>

      </div>
    </div>
  )
}