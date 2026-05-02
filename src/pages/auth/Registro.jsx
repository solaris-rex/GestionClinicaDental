// src/pages/auth/Registro.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

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

export default function Registro() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    telefono: '',
    dni: '',
    fecha_nacimiento: '',
    direccion: '',
  })

  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [progreso, setProgreso] = useState('')

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function validarFormulario() {
    if (!form.dni || form.dni.length !== 8) {
      return 'El DNI debe tener exactamente 8 dígitos.'
    }
    if (!/^\d+$/.test(form.dni)) {
      return 'El DNI solo debe contener números.'
    }
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

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const errorValidacion = validarFormulario()
    if (errorValidacion) {
      setError(errorValidacion)
      return
    }

    setCargando(true)
    setProgreso('Creando cuenta...')

    try {
      // Paso 1: Intentar crear usuario en Auth
      let userId = null
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })

      if (authError) {
        // Si ya está registrado, intentar login directo
        if (authError.message.includes('already registered')) {
          setProgreso('Verificando cuenta existente...')
          const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
          })
          if (loginErr) {
            setError('Este correo ya está registrado con otra contraseña. Prueba iniciando sesión.')
            setCargando(false)
            setProgreso('')
            return
          }
          userId = loginData?.user?.id
        } else if (authError.message.includes('rate limit')) {
          setError('Demasiados intentos. Espera unos minutos e intenta de nuevo.')
          setCargando(false)
          setProgreso('')
          return
        } else {
          setError('Error al registrar: ' + authError.message)
          setCargando(false)
          setProgreso('')
          return
        }
      } else {
        userId = data?.user?.id
      }

      if (!userId) {
        setError('No se pudo completar el registro. Intenta de nuevo.')
        setCargando(false)
        setProgreso('')
        return
      }

      // Paso 2: Verificar si ya tiene perfil
      setProgreso('Guardando perfil...')
      const { data: perfilExistente } = await supabase
        .from('perfiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle()

      if (!perfilExistente) {
        // Crear perfil con reintentos
        const { error: perfilError } = await conReintentos(() =>
          supabase.from('perfiles').insert({
            id: userId,
            nombre: form.nombre,
            apellido: form.apellido,
            telefono: form.telefono,
            rol: 'paciente',
            dni: form.dni,
          })
        )

        if (perfilError && perfilError.code !== '23505') {
          setError('Error al guardar perfil: ' + perfilError.message)
          setCargando(false)
          setProgreso('')
          return
        }
      }

      // Paso 3: Crear o actualizar paciente con reintentos
      setProgreso('Guardando datos del paciente...')
      const { error: pacienteError } = await conReintentos(() =>
        supabase.from('pacientes').upsert({
          nombre: form.nombre,
          apellido: form.apellido,
          dni: form.dni,
          telefono: form.telefono,
          email: form.email,
          fecha_nacimiento: form.fecha_nacimiento || null,
          direccion: form.direccion || null,
        }, { onConflict: 'dni' })
      )

      if (pacienteError) {
        setError('Error al guardar datos del paciente: ' + pacienteError.message)
        setCargando(false)
        setProgreso('')
        return
      }

      // Paso 4: Login automático
      setProgreso('Iniciando sesión...')
      const { error: loginError } = await conReintentos(() =>
        supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        })
      )

      if (loginError) {
        navigate('/login')
        return
      }

      setProgreso('')
      navigate('/dashboard')

    } catch (err) {
      setError('Ocurrió un error inesperado. Intenta de nuevo.')
      setCargando(false)
      setProgreso('')
    }
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

        {cargando && progreso && (
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg mb-4 text-sm flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            {progreso}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DNI <span className="text-red-500">*</span>
            </label>
            <input
              type="text" name="dni" value={form.dni}
              onChange={handleChange} required
              placeholder="Ingresa tu DNI"
              inputMode="numeric"
              maxLength={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="text" name="telefono" value={form.telefono}
                onChange={handleChange}
                placeholder="Ingrese su número"
                inputMode="numeric"
                maxLength={9}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de nacimiento
              </label>
              <input
                type="date" name="fecha_nacimiento" value={form.fecha_nacimiento}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              type="text" name="direccion" value={form.direccion}
              onChange={handleChange} placeholder="Ingrese su dirección"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
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
              onChange={handleChange} required
              placeholder="Mínimo 8 caracteres, mayúscula, número y símbolo"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
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