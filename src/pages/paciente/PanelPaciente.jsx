// src/pages/paciente/PanelPaciente.jsx
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/layout/Sidebar'
import { obtenerOdontologosDisponibles, crearCita } from '../../services/citasService'

const COLORES_ESTADO = {
  programada: 'bg-blue-100 text-blue-700',
  confirmada: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
  completada: 'bg-gray-100 text-gray-600',
}

const HORAS_DISPONIBLES = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
]

export default function PanelPaciente() {
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [citas, setCitas] = useState([])
  const [pacienteId, setPacienteId] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [vista, setVista] = useState('lista')

  const [form, setForm] = useState({ fecha: '', hora: '', odontologo_id: '', motivo: '' })
  const [odontologosDisponibles, setOdontologosDisponibles] = useState([])
  const [buscandoOdontologos, setBuscandoOdontologos] = useState(false)
  const [sinOdontologos, setSinOdontologos] = useState(false)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [exitoCita, setExitoCita] = useState(false)

  useEffect(() => {
    const vistaParam = searchParams.get('vista')
    setVista(vistaParam === 'nueva' ? 'nueva' : 'lista')
  }, [searchParams])

  useEffect(() => {
    if (perfil?.id) cargarDatos()
  }, [perfil])

  async function cargarDatos() {
    setCargando(true)
    const { data: authData } = await supabase.auth.getUser()
    const emailUsuario = authData?.user?.email
    if (!emailUsuario) { setCargando(false); return }

    const { data: perfilData } = await supabase
      .from('perfiles').select('*').eq('id', authData.user.id).maybeSingle()

    let pacienteData = null

    // Buscar por DNI primero
    if (perfilData?.dni) {
      const { data } = await supabase
        .from('pacientes').select('id').eq('dni', perfilData.dni).maybeSingle()
      pacienteData = data
    }

    // Buscar por email si no encontró por DNI
    if (!pacienteData && emailUsuario) {
      const { data } = await supabase
        .from('pacientes').select('id').eq('email', emailUsuario).maybeSingle()
      pacienteData = data
    }

    // Si no existe en pacientes, crearlo automáticamente
    if (!pacienteData && perfilData) {
      const { data: nuevo } = await supabase
        .from('pacientes')
        .insert({
          nombre: perfilData.nombre,
          apellido: perfilData.apellido,
          dni: perfilData.dni || `AUTO-${authData.user.id.slice(0, 8)}`,
          telefono: perfilData.telefono || null,
          email: emailUsuario,
        })
        .select('id')
        .single()
      pacienteData = nuevo
    }

    if (pacienteData) {
      setPacienteId(pacienteData.id)
      await cargarCitas(pacienteData.id)
    }

    setCargando(false)
  }

  async function cargarCitas(pId) {
    const { data } = await supabase
      .from('citas')
      .select('*, odontologo:perfiles(nombre, apellido)')
      .eq('paciente_id', pId)
      .order('fecha', { ascending: true })
    setCitas(data || [])
  }

  async function buscarOdontologosDisponibles(fecha, hora) {
    setBuscandoOdontologos(true)
    setSinOdontologos(false)
    setOdontologosDisponibles([])

    try {
      const { data } = await obtenerOdontologosDisponibles(fecha, hora)
      const lista = data || []
      setOdontologosDisponibles(lista)
      setSinOdontologos(lista.length === 0)
    } catch {
      setSinOdontologos(true)
    } finally {
      setBuscandoOdontologos(false)
    }
  }

  // ✅ Fix: un solo setForm, sin doble llamada
  function handleChange(e) {
    const { name, value } = e.target

    if (name === 'fecha' || name === 'hora') {
      // Calcular los nuevos valores de fecha y hora
      const nuevaFecha = name === 'fecha' ? value : form.fecha
      const nuevaHora = name === 'hora' ? value : form.hora

      // Un solo setForm que limpia el odontólogo
      setForm(prev => ({ ...prev, [name]: value, odontologo_id: '' }))
      setOdontologosDisponibles([])
      setSinOdontologos(false)

      // Solo buscar si ambos están seleccionados
      if (nuevaFecha && nuevaHora) {
        buscarOdontologosDisponibles(nuevaFecha, nuevaHora)
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  async function handleSolicitarCita(e) {
    e.preventDefault()
    setError('')

    if (!pacienteId) {
      setError('Tu cuenta no está vinculada. Comunícate con recepción.')
      return
    }
    if (!form.odontologo_id) {
      setError('Debes seleccionar un odontólogo.')
      return
    }

    setGuardando(true)
    try {
      const { error: citaError } = await crearCita({
        paciente_id: pacienteId,
        odontologo_id: form.odontologo_id,
        fecha: form.fecha,
        hora: form.hora + ':00',
        motivo: form.motivo,
        estado: 'programada',
      })

      if (citaError) {
        setError('Error al solicitar la cita: ' + citaError.message)
        return
      }

      await cargarCitas(pacienteId)
      setForm({ fecha: '', hora: '', odontologo_id: '', motivo: '' })
      setOdontologosDisponibles([])
      setSinOdontologos(false)
      setExitoCita(true)
      navigate('/paciente?vista=lista')
      setTimeout(() => setExitoCita(false), 4000)
    } catch (err) {
      setError('Ocurrió un error inesperado: ' + (err?.message || ''))
    } finally {
      setGuardando(false)
    }
  }

  function formatearFecha(fecha) {
    if (!fecha) return '—'
    const [anio, mes, dia] = fecha.split('-')
    return `${dia}/${mes}/${anio}`
  }

  function obtenerDiaSemana(fecha) {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    return dias[new Date(fecha + 'T00:00:00').getDay()]
  }

  const hoy = new Date().toISOString().split('T')[0]
  const citasPendientes = citas.filter(c => c.fecha >= hoy && c.estado !== 'cancelada')
  const citasPasadas = citas.filter(c => c.fecha < hoy || c.estado === 'completada')
  const puedeGuardar = form.fecha && form.hora && form.odontologo_id

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar rol="paciente" />

      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="w-full px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 ml-10">
            <span className="text-2xl">🦷</span>
            <span className="text-xl font-bold text-teal-700">DentaNovax</span>
          </div>
          <div className="flex items-center gap-3">
            {perfil?.avatar_url ? (
              <img src={perfil.avatar_url} alt="Avatar"
                className="w-9 h-9 rounded-full object-cover border-2 border-teal-500" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
                {perfil?.nombre?.charAt(0)}{perfil?.apellido?.charAt(0)}
              </div>
            )}
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">¡Hola, {perfil?.nombre}! 👋</p>
              <p className="text-xs text-gray-400">
                {new Date().toLocaleDateString('es-PE', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-1">👋 Hola, {perfil?.nombre}</h1>
          <p className="text-teal-100">Bienvenido a tu panel de citas — {formatearFecha(hoy)}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {exitoCita && (
          <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            ✅ ¡Cita solicitada exitosamente! Te esperamos.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center border-t-4 border-teal-500">
            <p className="text-4xl font-bold text-teal-600">{citasPendientes.length}</p>
            <p className="text-gray-500 mt-1 text-sm">Citas pendientes</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center border-t-4 border-gray-300">
            <p className="text-4xl font-bold text-gray-600">{citasPasadas.length}</p>
            <p className="text-gray-500 mt-1 text-sm">Citas anteriores</p>
          </div>
          <div
            className="bg-teal-600 rounded-2xl shadow-sm p-6 text-center cursor-pointer hover:bg-teal-700 transition"
            onClick={() => navigate('/paciente?vista=nueva')}
          >
            <p className="text-4xl mb-1">📅</p>
            <p className="text-white font-semibold">+ Solicitar nueva cita</p>
          </div>
        </div>

        {vista === 'nueva' && (
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">📅 Solicitar nueva cita</h2>
              <button
                onClick={() => navigate('/paciente?vista=lista')}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕ Cancelar
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            {/* Aviso si no tiene pacienteId */}
            {!pacienteId && !cargando && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl mb-4 text-sm">
                ⚠️ Tu cuenta no está completamente vinculada. Recarga la página o comunícate con recepción.
              </div>
            )}

            <form onSubmit={handleSolicitarCita} className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Paso 1 — Elige fecha y hora
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date" name="fecha" value={form.fecha}
                      onChange={handleChange} required min={hoy}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="hora" value={form.hora}
                      onChange={handleChange} required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50"
                    >
                      <option value="">Seleccione una hora</option>
                      {HORAS_DISPONIBLES.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {(form.fecha && form.hora) && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Paso 2 — Elige un odontólogo disponible
                  </p>
                  {buscandoOdontologos ? (
                    <div className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-400 bg-gray-50 animate-pulse">
                      🔍 Buscando odontólogos disponibles...
                    </div>
                  ) : sinOdontologos ? (
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm">
                      ⚠️ No hay odontólogos disponibles en ese horario. Por favor elige otra fecha u hora.
                    </div>
                  ) : (
                    <select
                      name="odontologo_id" value={form.odontologo_id}
                      onChange={handleChange} required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50"
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

              {form.odontologo_id && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Paso 3 — Motivo (opcional)
                  </p>
                  <textarea
                    name="motivo" value={form.motivo}
                    onChange={handleChange}
                    placeholder="Describe brevemente el motivo de tu visita"
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 resize-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={guardando || !puedeGuardar || sinOdontologos || buscandoOdontologos}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
              >
                {guardando ? 'Solicitando...' : 'Confirmar cita'}
              </button>
            </form>
          </div>
        )}

        {vista === 'lista' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b">
              <h2 className="text-lg font-bold text-gray-800">Mis citas</h2>
            </div>
            {cargando ? (
              <div className="text-center py-16">
                <p className="text-gray-400 animate-pulse">Cargando tus citas...</p>
              </div>
            ) : citas.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-5xl mb-4">📭</p>
                <p className="text-gray-600 font-medium">No tienes citas registradas aún</p>
                <button
                  onClick={() => navigate('/paciente?vista=nueva')}
                  className="mt-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2 rounded-xl transition"
                >
                  + Solicitar cita
                </button>
              </div>
            ) : (
              <div className="divide-y">
                {citas.map((cita) => (
                  <div key={cita.id} className="px-6 py-5 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4 items-start">
                        <div className="bg-teal-50 rounded-xl p-3 text-center min-w-16">
                          <p className="text-xs text-teal-600 font-medium">
                            {obtenerDiaSemana(cita.fecha).slice(0, 3).toUpperCase()}
                          </p>
                          <p className="text-xl font-bold text-teal-700">
                            {cita.fecha?.split('-')[2]}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            🕐 {cita.hora?.slice(0, 5)} hrs
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Dr. {cita.odontologo?.nombre} {cita.odontologo?.apellido}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${COLORES_ESTADO[cita.estado]}`}>
                        {cita.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="bg-gray-900 text-gray-400 py-6 px-6 mt-12">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center gap-2">
            <span>🦷</span>
            <span className="text-white font-semibold">DentaNovax</span>
          </div>
          <p>© 2026 DentaNovax. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}