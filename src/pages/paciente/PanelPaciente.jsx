// src/pages/paciente/PanelPaciente.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { obtenerOdontologos, crearCita, verificarDisponibilidad } from '../../services/citasService'

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
  const { perfil, cerrarSesion } = useAuth()
  const navigate = useNavigate()
  const [citas, setCitas] = useState([])
  const [odontologos, setOdontologos] = useState([])
  const [pacienteId, setPacienteId] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [vista, setVista] = useState('lista')
  const [disponibilidad, setDisponibilidad] = useState(null)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [exitoCita, setExitoCita] = useState(false)

  const [form, setForm] = useState({
    odontologo_id: '',
    fecha: '',
    hora: '',
    motivo: '',
  })

  useEffect(() => {
    if (perfil?.id) cargarDatos()
  }, [perfil])

  async function cargarDatos() {
    setCargando(true)
    const { data: authData } = await supabase.auth.getUser()
    const emailUsuario = authData?.user?.email

    if (!emailUsuario) { setCargando(false); return }

    const { data: perfilData } = await supabase
      .from('perfiles').select('dni').eq('id', authData.user.id).maybeSingle()

    let pacienteData = null
    if (perfilData?.dni) {
      const { data } = await supabase
        .from('pacientes').select('id').eq('dni', perfilData.dni).maybeSingle()
      pacienteData = data
    }
    if (!pacienteData && emailUsuario) {
      const { data } = await supabase
        .from('pacientes').select('id').eq('email', emailUsuario).maybeSingle()
      pacienteData = data
    }
    if (pacienteData) {
      setPacienteId(pacienteData.id)
      await cargarCitas(pacienteData.id)
    }
    const { data: docs } = await obtenerOdontologos()
    setOdontologos(docs || [])
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

  function handleChange(e) {
    const nuevoForm = { ...form, [e.target.name]: e.target.value }
    setForm(nuevoForm)
    if (nuevoForm.odontologo_id && nuevoForm.fecha && nuevoForm.hora) {
      verificarHorario(nuevoForm)
    }
  }

  async function verificarHorario(nuevoForm) {
    const { disponible } = await verificarDisponibilidad(
      nuevoForm.odontologo_id, nuevoForm.fecha, nuevoForm.hora + ':00'
    )
    setDisponibilidad(disponible)
  }

  async function handleSolicitarCita(e) {
    e.preventDefault()
    setError('')
    if (!pacienteId) { setError('Tu cuenta no está vinculada. Comunícate con recepción.'); return }
    if (disponibilidad === false) { setError('El odontólogo ya tiene cita en ese horario.'); return }
    setGuardando(true)

    const timeoutId = setTimeout(() => {
      setGuardando(false)
      setError('La operación tardó demasiado. Intenta de nuevo.')
    }, 10000)

    try {
      const { error: citaError } = await crearCita({
        paciente_id: pacienteId,
        odontologo_id: form.odontologo_id,
        fecha: form.fecha,
        hora: form.hora + ':00',
        motivo: form.motivo,
        estado: 'programada',
      })
      clearTimeout(timeoutId)
      if (citaError) { setError('Error al solicitar la cita: ' + citaError.message); setGuardando(false); return }
      await cargarCitas(pacienteId)
      setVista('lista')
      setForm({ odontologo_id: '', fecha: '', hora: '', motivo: '' })
      setDisponibilidad(null)
      setExitoCita(true)
      setTimeout(() => setExitoCita(false), 4000)
    } catch (err) {
      clearTimeout(timeoutId)
      setError('Ocurrió un error inesperado.')
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

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ===== NAVBAR ===== */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <span className="text-2xl">🦷</span>
            <span className="text-xl font-bold text-teal-700">DentaNovax</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">
                {perfil?.nombre} {perfil?.apellido}
              </p>
              <p className="text-xs text-teal-600">Paciente</p>
            </div>
            <button
              onClick={cerrarSesion}
              className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      {/* ===== HERO DEL PANEL ===== */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-1">
            👋 Hola, {perfil?.nombre}
          </h1>
          <p className="text-teal-100">Bienvenido a tu panel de citas — {formatearFecha(hoy)}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Mensaje de éxito */}
        {exitoCita && (
          <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            ✅ ¡Cita solicitada exitosamente! Te esperamos.
          </div>
        )}

        {/* Tarjetas resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center border-t-4 border-teal-500">
            <p className="text-4xl font-bold text-teal-600">{citasPendientes.length}</p>
            <p className="text-gray-500 mt-1 text-sm">Citas pendientes</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center border-t-4 border-gray-300">
            <p className="text-4xl font-bold text-gray-600">{citasPasadas.length}</p>
            <p className="text-gray-500 mt-1 text-sm">Citas anteriores</p>
          </div>
          <div className="bg-teal-600 rounded-2xl shadow-sm p-6 text-center cursor-pointer hover:bg-teal-700 transition"
            onClick={() => { setVista('nueva'); setError('') }}>
            <p className="text-4xl mb-1">📅</p>
            <p className="text-white font-semibold">+ Solicitar nueva cita</p>
          </div>
        </div>

        {/* Formulario nueva cita */}
        {vista === 'nueva' && (
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">📅 Solicitar nueva cita</h2>
              <button
                onClick={() => { setVista('lista'); setError(''); setDisponibilidad(null) }}
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

            {!pacienteId && !cargando && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-xl mb-4 text-sm">
                ⚠️ Tu cuenta no está vinculada. Comunícate con recepción.
              </div>
            )}

            <form onSubmit={handleSolicitarCita} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Odontólogo <span className="text-red-500">*</span>
                </label>
                <select
                  name="odontologo_id" value={form.odontologo_id}
                  onChange={handleChange} required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50"
                >
                  <option value="">Seleccione un odontólogo</option>
                  {odontologos.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.nombre} {d.apellido}
                    </option>
                  ))}
                </select>
              </div>

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

              {disponibilidad !== null && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                  disponibilidad ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {disponibilidad ? '✅ Horario disponible' : '❌ Horario ocupado — elige otro'}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de la consulta
                </label>
                <textarea
                  name="motivo" value={form.motivo}
                  onChange={handleChange}
                  placeholder="Describe brevemente el motivo de tu visita"
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={guardando || disponibilidad === false || !pacienteId}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
              >
                {guardando ? 'Solicitando...' : 'Confirmar cita'}
              </button>
            </form>
          </div>
        )}

        {/* Lista de citas */}
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
                <p className="text-sm text-gray-400 mt-2 mb-6">
                  Solicita tu primera cita haciendo clic en el botón de arriba
                </p>
                <button
                  onClick={() => { setVista('nueva'); setError('') }}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2 rounded-xl transition"
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
                        {/* Fecha destacada */}
                        <div className="bg-teal-50 rounded-xl p-3 text-center min-w-16">
                          <p className="text-xs text-teal-600 font-medium">
                            {obtenerDiaSemana(cita.fecha).slice(0, 3).toUpperCase()}
                          </p>
                          <p className="text-xl font-bold text-teal-700">
                            {cita.fecha?.split('-')[2]}
                          </p>
                          <p className="text-xs text-teal-500">
                            {['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][parseInt(cita.fecha?.split('-')[1]) - 1]}
                          </p>
                        </div>
                        {/* Info */}
                        <div>
                          <p className="font-semibold text-gray-800">
                            🕐 {cita.hora?.slice(0, 5)} hrs
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Dr. {cita.odontologo?.nombre} {cita.odontologo?.apellido}
                          </p>
                          {cita.motivo && (
                            <p className="text-sm text-gray-400 mt-1">
                              📋 {cita.motivo}
                            </p>
                          )}
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

      {/* Footer */}
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