// src/components/pacientes/FormularioPaciente.jsx
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const FORM_VACIO = {
  nombre: '',
  apellido: '',
  dni: '',
  telefono: '',
  email: '',
  fecha_nacimiento: '',
  direccion: '',
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

export default function FormularioPaciente({ pacienteInicial, onGuardar, onCancelar }) {
  const [form, setForm] = useState(pacienteInicial || FORM_VACIO)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [progreso, setProgreso] = useState('')

  const esNuevo = !pacienteInicial

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
    if (password && !form.email) {
      return 'El correo es obligatorio para crear acceso al sistema.'
    }
    if (password && password.length < 8) {
      return 'La contraseña debe tener mínimo 8 caracteres.'
    }
    if (password && !/[A-Z]/.test(password)) {
      return 'La contraseña debe contener al menos una letra mayúscula.'
    }
    if (password && !/\d.*\d/.test(password)) {
      return 'La contraseña debe contener al menos 2 números.'
    }
    if (password && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return 'La contraseña debe contener al menos un carácter especial.'
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

    try {
      // Paso 1: Guardar datos del paciente
      setProgreso('Guardando paciente...')
      const resultado = await onGuardar(form)

      if (resultado?.error) {
        if (resultado.error.code === '23505') {
          setError('Ya existe un paciente con ese DNI.')
        } else {
          setError('Error al guardar: ' + resultado.error.message)
        }
        setCargando(false)
        setProgreso('')
        return
      }

      // Paso 2: Crear cuenta si pusieron contraseña
      if (esNuevo && password && form.email) {
        setProgreso('Creando acceso al sistema...')

        // Guardar sesión actual de la recepcionista/admin
        const { data: sesionActual } = await supabase.auth.getSession()
        const tokenActual = sesionActual?.session?.access_token
        const refreshActual = sesionActual?.session?.refresh_token

        const { data, error: authError } = await supabase.auth.signUp({
          email: form.email,
          password: password,
        })

        if (authError) {
          setError('✅ Paciente guardado, pero error al crear acceso: ' + authError.message)
          // Restaurar sesión aunque haya error
          if (tokenActual && refreshActual) {
            await supabase.auth.setSession({
              access_token: tokenActual,
              refresh_token: refreshActual,
            })
          }
          setCargando(false)
          setProgreso('')
          return
        }

        const userId = data?.user?.id
        if (userId) {
          setProgreso('Configurando perfil...')
          await conReintentos(() =>
            supabase.from('perfiles').insert({
              id: userId,
              nombre: form.nombre,
              apellido: form.apellido,
              telefono: form.telefono,
              rol: 'paciente',
              dni: form.dni,
            })
          )
        }

        // Restaurar sesión de la recepcionista/admin
        if (tokenActual && refreshActual) {
          setProgreso('Restaurando sesión...')
          await supabase.auth.setSession({
            access_token: tokenActual,
            refresh_token: refreshActual,
          })
        }
      }

      setProgreso('')
      setCargando(false)

    } catch (err) {
      setError('Ocurrió un error inesperado.')
      setCargando(false)
      setProgreso('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className={`px-4 py-2 rounded-lg text-sm ${
          error.startsWith('✅')
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {error}
        </div>
      )}

      {cargando && progreso && (
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <span className="animate-spin">⏳</span>
          {progreso}
        </div>
      )}

      {/* Nombre y Apellido */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            type="text" name="nombre" value={form.nombre}
            onChange={handleChange} required placeholder="Ingrese el nombre"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apellido <span className="text-red-500">*</span>
          </label>
          <input
            type="text" name="apellido" value={form.apellido}
            onChange={handleChange} required placeholder="Ingrese el apellido"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
      </div>

      {/* DNI y Teléfono */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            DNI <span className="text-red-500">*</span>
          </label>
          <input
            type="text" name="dni" value={form.dni}
            onChange={handleChange} required placeholder="Ingrese el DNI"
            inputMode="numeric" maxLength={8}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input
            type="text" name="telefono" value={form.telefono}
            onChange={handleChange} placeholder="Ingrese su teléfono"
            inputMode="numeric" maxLength={9}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
      </div>

      {/* Email y Fecha de nacimiento */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email" name="email" value={form.email}
            onChange={handleChange} placeholder="correo@ejemplo.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de nacimiento
          </label>
          <input
            type="date" name="fecha_nacimiento" value={form.fecha_nacimiento}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
      </div>

      {/* Dirección */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
        <input
          type="text" name="direccion" value={form.direccion}
          onChange={handleChange} placeholder="Ingrese la dirección"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      {/* Contraseña temporal — solo al crear nuevo paciente */}
      {esNuevo && (
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña temporal
            <span className="text-gray-400 font-normal ml-1">(opcional)</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Si desea crear acceso al sistema para el paciente"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />

          {password && (
            <div className="mt-2 space-y-1">
              <p className={`text-xs flex items-center gap-1 ${password.length >= 8 ? 'text-green-600' : 'text-red-500'}`}>
                {password.length >= 8 ? '✅' : '❌'} Mínimo 8 caracteres
              </p>
              <p className={`text-xs flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-red-500'}`}>
                {/[A-Z]/.test(password) ? '✅' : '❌'} Al menos una mayúscula
              </p>
              <p className={`text-xs flex items-center gap-1 ${/\d.*\d/.test(password) ? 'text-green-600' : 'text-red-500'}`}>
                {/\d.*\d/.test(password) ? '✅' : '❌'} Al menos 2 números
              </p>
              <p className={`text-xs flex items-center gap-1 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-green-600' : 'text-red-500'}`}>
                {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? '✅' : '❌'} Al menos un carácter especial
              </p>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-2">
            💡 Si ingresa una contraseña, el paciente podrá iniciar sesión directamente con su correo y esta contraseña temporal.
          </p>
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit" disabled={cargando}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
        >
          {cargando ? 'Guardando...' : 'Guardar paciente'}
        </button>
        <button
          type="button" onClick={onCancelar}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}