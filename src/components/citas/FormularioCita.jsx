// src/components/citas/FormularioCita.jsx
import { useState, useEffect } from 'react'
import { obtenerOdontologosDisponibles, verificarDisponibilidad } from '../../services/citasService'
import { buscarPacientes } from '../../services/pacientesService'

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
  const [odontologosDisponibles, setOdontologosDisponibles] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [busquedaPaciente, setBusquedaPaciente] = useState('')
  const [buscandoOdontologos, setBuscandoOdontologos] = useState(false)
  const [sinOdontologos, setSinOdontologos] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  // Si hay citaInicial (reprogramar), cargar odontólogos disponibles para esa fecha/hora
  useEffect(() => {
    if (citaInicial?.fecha && citaInicial?.hora) {
      buscarOdontologosDisponibles(citaInicial.fecha, citaInicial.hora)
    }
  }, [])

  async function handleBusquedaPaciente(e) {
    const termino = e.target.value
    setBusquedaPaciente(termino)
    setForm(prev => ({ ...prev, paciente_id: '' }))
    if (termino.trim() === '') {
      setPacientes([])
      return
    }
    const { data } = await buscarPacientes(termino)
    setPacientes(data || [])
  }

  async function buscarOdontologosDisponibles(fecha, hora) {
    if (!fecha || !hora) return
    setBuscandoOdontologos(true)
    setSinOdontologos(false)
    setOdontologosDisponibles([])
    setForm(prev => ({ ...prev, odontologo_id: '' }))

    const { data } = await obtenerOdontologosDisponibles(fecha, hora)
    setOdontologosDisponibles(data || [])
    setSinOdontologos((data || []).length === 0)
    setBuscandoOdontologos(false)
  }

  function handleChange(e) {
    const { name, value } = e.target
    const nuevoForm = { ...form, [name]: value }
    setForm(nuevoForm)

    // Buscar odontólogos disponibles cuando cambia fecha u hora
    if (name === 'fecha' || name === 'hora') {
      const fecha = name === 'fecha' ? value : nuevoForm.fecha
      const hora = name === 'hora' ? value : nuevoForm.hora
      if (fecha && hora) {
        buscarOdontologosDisponibles(fecha, hora)
      } else {
        setOdontologosDisponibles([])
        setSinOdontologos(false)
        setForm(prev => ({ ...prev, [name]: value, odontologo_id: '' }))
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.paciente_id) {
      setError('Debes seleccionar un paciente.')
      return
    }
    if (!form.odontologo_id) {
      setError('Debes seleccionar un odontólogo.')
      return
    }

    const { disponible } = await verificarDisponibilidad(
      form.odontologo_id,
      form.fecha,
      form.hora + ':00',
      citaInicial?.id
    )
    if (!disponible) {
      setError('El odontólogo ya no está disponible en ese horario. Por favor elige otro.')
      await buscarOdontologosDisponibles(form.fecha, form.hora)
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

  const hoy = new Date().toISOString().split('T')[0]
  const puedeGuardar = form.paciente_id && form.fecha && form.hora && form.odontologo_id

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Paciente — solo mostrar si es nueva cita, no al reprogramar */}
      {!citaInicial ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Paciente <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={busquedaPaciente}
            onChange={handleBusquedaPaciente}
            placeholder="🔍 Buscar paciente por nombre o DNI..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {busquedaPaciente.trim() !== '' && (
            <div className="border border-gray-200 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-sm bg-white">
              {pacientes.length === 0 ? (
                <p className="text-sm text-gray-400 px-3 py-2">No se encontraron pacientes</p>
              ) : (
                pacientes.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, paciente_id: p.id })
                      setBusquedaPaciente(`${p.apellido}, ${p.nombre} — DNI: ${p.dni}`)
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 border-b border-gray-100 last:border-0"
                  >
                    <span className="font-medium text-gray-800">{p.apellido}, {p.nombre}</span>
                    <span className="text-gray-400 ml-2">DNI: {p.dni}</span>
                  </button>
                ))
              )}
            </div>
          )}
          {form.paciente_id && busquedaPaciente.trim() !== '' && (
            <p className="text-xs text-green-600 mt-1 font-medium">✅ Paciente seleccionado</p>
          )}
        </div>
      ) : (
        /* Si es reprogramación, mantenemos el ID oculto sin mostrar el buscador */
        <input type="hidden" name="paciente_id" value={form.paciente_id} />
      )}

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

      {/* Odontólogo — aparece después de elegir fecha y hora */}
      {(form.fecha && form.hora) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Odontólogo disponible <span className="text-red-500">*</span>
          </label>

          {buscandoOdontologos ? (
            <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50">
              🔍 Buscando odontólogos disponibles...
            </div>
          ) : sinOdontologos ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm">
              ⚠️ No hay odontólogos disponibles en ese horario. Por favor elige otra fecha u hora.
            </div>
          ) : (
            <select
              name="odontologo_id"
              value={form.odontologo_id}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="">Seleccione un odontólogo</option>
              {odontologosDisponibles.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.nombre} {d.apellido}
                </option>
              ))}
            </select>
          )}
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
          disabled={cargando || !puedeGuardar || sinOdontologos}
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