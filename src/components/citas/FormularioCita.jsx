// src/components/citas/FormularioCita.jsx
// Formulario para programar o reprogramar una cita.
// Valida disponibilidad antes de guardar.

import { useState, useEffect } from 'react'
import { obtenerOdontologos, verificarDisponibilidad } from '../../services/citasService'
import { obtenerPacientes, buscarPacientes } from '../../services/pacientesService'

const HORAS_DISPONIBLES = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
]

const FORM_VACIO = {
  paciente_id: '',
  odontologo_id: '',
  fecha: '',
  hora: '',
  motivo: '',
}

export default function FormularioCita({ citaInicial, onGuardar, onCancelar }) {
  const [form, setForm] = useState(citaInicial || FORM_VACIO)
  const [odontologos, setOdontologos] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [busquedaPaciente, setBusquedaPaciente] = useState('')
  const [disponibilidad, setDisponibilidad] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const [{ data: docs }, { data: pacs }] = await Promise.all([
      obtenerOdontologos(),
      obtenerPacientes(),
    ])
    setOdontologos(docs || [])
    setPacientes(pacs || [])
  }

  async function handleBusquedaPaciente(e) {
    const termino = e.target.value
    setBusquedaPaciente(termino)
    if (termino.trim() === '') {
      const { data } = await obtenerPacientes()
      setPacientes(data || [])
    } else {
      const { data } = await buscarPacientes(termino)
      setPacientes(data || [])
    }
  }

  // Verificar disponibilidad cuando cambian odontólogo, fecha u hora
  async function verificar(nuevoForm) {
    if (nuevoForm.odontologo_id && nuevoForm.fecha && nuevoForm.hora) {
      const { disponible } = await verificarDisponibilidad(
        nuevoForm.odontologo_id,
        nuevoForm.fecha,
        nuevoForm.hora + ':00',
        citaInicial?.id
      )
      setDisponibilidad(disponible)
    } else {
      setDisponibilidad(null)
    }
  }

  function handleChange(e) {
    const nuevoForm = { ...form, [e.target.name]: e.target.value }
    setForm(nuevoForm)
    verificar(nuevoForm)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (disponibilidad === false) {
      setError('El odontólogo ya tiene una cita en ese horario.')
      return
    }

    setCargando(true)

    const timeout = setTimeout(() => {
      setCargando(false)
      setError('La operación tardó demasiado. Intenta de nuevo.')
    }, 8000)

    try {
      const resultado = await onGuardar({
        ...form,
        hora: form.hora + ':00',
      })
      clearTimeout(timeout)

      if (resultado?.error) {
        setError('Error al guardar la cita: ' + resultado.error.message)
        setCargando(false)
      }
    } catch (err) {
      clearTimeout(timeout)
      setError('Ocurrió un error inesperado.')
      setCargando(false)
    }
  }

  // Fecha mínima: hoy
  const hoy = new Date().toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Buscar paciente */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Buscar paciente
        </label>
        <input
          type="text"
          value={busquedaPaciente}
          onChange={handleBusquedaPaciente}
          placeholder="Buscar por nombre o DNI..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 mb-2"
        />
        <select
          name="paciente_id"
          value={form.paciente_id}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <option value="">Seleccione un paciente</option>
          {pacientes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.apellido}, {p.nombre} — DNI: {p.dni}
            </option>
          ))}
        </select>
      </div>

      {/* Odontólogo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Odontólogo <span className="text-red-500">*</span>
        </label>
        <select
          name="odontologo_id"
          value={form.odontologo_id}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <option value="">Seleccione un odontólogo</option>
          {odontologos.map((d) => (
            <option key={d.id} value={d.id}>
              Dr. {d.nombre} {d.apellido}
            </option>
          ))}
        </select>
      </div>

      {/* Fecha y Hora */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            required
            min={hoy}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hora <span className="text-red-500">*</span>
          </label>
          <select
            name="hora"
            value={form.hora}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="">Seleccione una hora</option>
            {HORAS_DISPONIBLES.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Indicador de disponibilidad */}
      {disponibilidad !== null && (
        <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
          disponibilidad
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {disponibilidad
            ? '✅ Horario disponible'
            : '❌ Horario ocupado — elige otro'}
        </div>
      )}

      {/* Motivo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Motivo de la consulta
        </label>
        <textarea
          name="motivo"
          value={form.motivo}
          onChange={handleChange}
          placeholder="Ingrese el motivo de la consulta"
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
        />
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={cargando || disponibilidad === false}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
        >
          {cargando ? 'Guardando...' : 'Guardar cita'}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}