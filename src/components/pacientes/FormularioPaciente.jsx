// src/components/pacientes/FormularioPaciente.jsx
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const FORM_VACIO = {
  nombre: '', apellido: '', dni: '', telefono: '',
  email: '', fecha_nacimiento: '', direccion: '',
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
    if (!form.dni || form.dni.length !== 8) return 'El DNI debe tener exactamente 8 dígitos.'
    if (!/^\d+$/.test(form.dni)) return 'El DNI solo debe contener números.'
    if (form.telefono && form.telefono.length !== 9) return 'El teléfono debe tener exactamente 9 dígitos.'
    if (form.telefono && !/^\d+$/.test(form.telefono)) return 'El teléfono solo debe contener números.'
    if (password && !form.email) return 'El correo es obligatorio para crear acceso al sistema.'
    if (password && password.length < 8) return 'La contraseña debe tener mínimo 8 caracteres.'
    if (password && !/[A-Z]/.test(password)) return 'La contraseña debe contener al menos una letra mayúscula.'
    if (password && !/\d.*\d/.test(password)) return 'La contraseña debe contener al menos 2 números.'
    if (password && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return 'La contraseña debe contener al menos un carácter especial.'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const errorValidacion = validarFormulario()
    if (errorValidacion) { setError(errorValidacion); return }

    setCargando(true)

    // Timeout global de 15 segundos
    const timeoutId = setTimeout(() => {
      setCargando(false)
      setProgreso('')
      setError('La operación tardó demasiado. El paciente puede haberse guardado — verifica la lista antes de intentar de nuevo.')
    }, 15000)

    try {
      // Paso 1: Guardar paciente
      setProgreso('Guardando paciente...')
      const resultado = await onGuardar(form)

      if (resultado?.error) {
        clearTimeout(timeoutId)
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

        // Guardar sesión actual
        const { data: sesionActual } = await supabase.auth.getSession()
        const tokenActual = sesionActual?.session?.access_token
        const refreshActual = sesionActual?.session?.refresh_token

        // signUp con timeout propio de 8 segundos
        const signUpPromise = supabase.auth.signUp({
          email: form.email,
          password: password,
          options: {
            // Evitar redirección de confirmación
            emailRedirectTo: undefined,
          }
        })

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), 8000)
        )

        let userId = null
        try {
          const { data, error: authError } = await Promise.race([signUpPromise, timeoutPromise])

          if (authError) {
            // No bloquear — el paciente ya se guardó
            console.warn('Error al crear cuenta:', authError.message)
          } else {
            userId = data?.user?.id
          }
        } catch (raceErr) {
          if (raceErr.message === 'TIMEOUT') {
            console.warn('signUp tardó demasiado, continuando sin crear cuenta')
          }
        }

        // Crear perfil si obtuvimos userId
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

        // Restaurar sesión de recepcionista/admin
        if (tokenActual && refreshActual) {
          setProgreso('Restaurando sesión...')
          await supabase.auth.setSession({
            access_token: tokenActual,
            refresh_token: refreshActual,
          })
        }
      }

      clearTimeout(timeoutId)
      setProgreso('')
      setCargando(false)

    } catch (err) {
      clearTimeout(timeoutId)
      setError('Ocurrió un error inesperado.')
      setCargando(false)
      setProgreso('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className={`px-4 py-2 rounded-lg text-sm ${
          error.startsWith('✅') ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
        }`}>
          {error}
        </div>
      )}

      {cargando && progreso && (
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <span className="animate-spin">⏳</span> {progreso}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
          <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required
            placeholder="Ingrese el nombre"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Apellido <span className="text-red-500">*</span></label>
          <input type="text" name="apellido" value={form.apellido} onChange={handleChange} required
            placeholder="Ingrese el apellido"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">DNI <span className="text-red-500">*</span></label>
          <input type="text" name="dni" value={form.dni} onChange={handleChange} required
            placeholder="8 dígitos" inputMode="numeric" maxLength={8}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input type="text" name="telefono" value={form.telefono} onChange={handleChange}
            placeholder="9 dígitos" inputMode="numeric" maxLength={9}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange}
            placeholder="correo@ejemplo.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
          <input type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
        <input type="text" name="direccion" value={form.direccion} onChange={handleChange}
          placeholder="Ingrese la dirección"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
      </div>

      {esNuevo && (
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña temporal
          </label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Si desea crear acceso al sistema para el paciente"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />

          {password && (
            <div className="mt-2 space-y-1">
              {[
                [password.length >= 8, 'Mínimo 8 caracteres'],
                [/[A-Z]/.test(password), 'Al menos una mayúscula'],
                [/\d.*\d/.test(password), 'Al menos 2 números'],
                [/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), 'Al menos un carácter especial'],
              ].map(([ok, label]) => (
                <p key={label} className={`text-xs flex items-center gap-1 ${ok ? 'text-green-600' : 'text-red-500'}`}>
                  {ok ? '✅' : '❌'} {label}
                </p>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">
            💡 Si ingresa una contraseña, el paciente podrá iniciar sesión con su correo y esta contraseña temporal.
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={cargando}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50">
          {cargando ? 'Guardando...' : 'Guardar paciente'}
        </button>
        <button type="button" onClick={onCancelar}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition">
          Cancelar
        </button>
      </div>
    </form>
  )
}