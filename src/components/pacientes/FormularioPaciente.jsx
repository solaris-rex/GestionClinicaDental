// src/components/pacientes/FormularioPaciente.jsx
// Formulario reutilizable para crear y editar pacientes.
// Recibe 'pacienteInicial' para edición o vacío para nuevo registro.

import { useState } from 'react'

const FORM_VACIO = {
  nombre: '',
  apellido: '',
  dni: '',
  telefono: '',
  email: '',
  fecha_nacimiento: '',
  direccion: '',
}

export default function FormularioPaciente({ pacienteInicial, onGuardar, onCancelar }) {
  const [form, setForm] = useState(pacienteInicial || FORM_VACIO)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
  e.preventDefault()
  setError('')
  setCargando(true)

  // Timeout de seguridad
  const timeout = setTimeout(() => {
    setCargando(false)
    setError('La operación tardó demasiado. Intenta de nuevo.')
  }, 8000)

  try {
    const resultado = await onGuardar(form)
    clearTimeout(timeout)

    if (resultado?.error) {
      if (resultado.error.code === '23505') {
        setError('Ya existe un paciente con ese DNI.')
      } else {
        setError('Error al guardar: ' + resultado.error.message)
      }
      setCargando(false)
    }
  } catch (err) {
    clearTimeout(timeout)
    setError('Ocurrió un error inesperado.')
    setCargando(false)
  }
}

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input
            type="text" name="telefono" value={form.telefono}
            onChange={handleChange} placeholder="Ingrese su teléfono"
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
          onChange={handleChange} placeholder="Av. Principal 123"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

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