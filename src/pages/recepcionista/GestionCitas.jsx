// src/pages/recepcionista/GestionCitas.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../../components/layout/Sidebar'
import FormularioCita from '../../components/citas/FormularioCita'
import {
  obtenerCitas,
  crearCita,
  actualizarEstadoCita,
  reprogramarCita,
} from '../../services/citasService'

const COLORES_ESTADO = {
  programada: 'bg-blue-100 text-blue-700',
  cancelada: 'bg-red-100 text-red-700',
  completada: 'bg-gray-100 text-gray-600',
}

export default function GestionCitas() {
  const navigate = useNavigate()
  const { perfil } = useAuth()
  const [citas, setCitas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [vista, setVista] = useState('lista')
  const [citaSeleccionada, setCitaSeleccionada] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('todas')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    cargarCitas()
    // Auto-completar citas cuya hora ya pasó
    const intervalo = setInterval(completarCitasPasadas, 60000)
    return () => clearInterval(intervalo)
  }, [])

  function getRutaVolver() {
    if (perfil?.rol === 'administrador') return '/admin'
    return '/recepcionista'
  }

  async function cargarCitas() {
    setCargando(true)
    const { data } = await obtenerCitas()
    const citasData = data || []
    setCitas(citasData)
    setCargando(false)
    // Completar automáticamente al cargar
    await completarCitasPasadasDesdeLista(citasData)
  }

  async function completarCitasPasadasDesdeLista(listaCitas) {
    const ahora = new Date()
    const hoy = ahora.toISOString().split('T')[0]
    const horaActual = ahora.toTimeString().slice(0, 5)

    const paraCompletar = listaCitas.filter(c => {
      if (c.estado !== 'programada') return false
      if (c.fecha < hoy) return true
      if (c.fecha === hoy && c.hora?.slice(0, 5) < horaActual) return true
      return false
    })

    for (const cita of paraCompletar) {
      await actualizarEstadoCita(cita.id, 'completada')
    }

    if (paraCompletar.length > 0) {
      const { data } = await obtenerCitas()
      setCitas(data || [])
    }
  }

  async function completarCitasPasadas() {
    const { data } = await obtenerCitas()
    if (data) await completarCitasPasadasDesdeLista(data)
  }

  async function handleGuardarNueva(form) {
    const resultado = await crearCita(form)
    if (!resultado.error) {
      await cargarCitas()
      setVista('lista')
    }
    return resultado
  }

  async function handleReprogramar(form) {
    const resultado = await reprogramarCita(
      citaSeleccionada.id,
      form.fecha,
      form.hora
    ) 
    if (!resultado.error) {
      await cargarCitas()
      setVista('lista')
    }
    return resultado
  }

  async function handleCancelar(id) {
    await actualizarEstadoCita(id, 'cancelada')
    await cargarCitas()
  }

  // Filtrar por estado y búsqueda
  const citasFiltradas = citas
    .filter(c => filtroEstado === 'todas' || c.estado === filtroEstado)
    .filter(c => {
      if (!busqueda.trim()) return true
      const termino = busqueda.toLowerCase()
      const nombre = `${c.paciente?.nombre} ${c.paciente?.apellido}`.toLowerCase()
      const dni = c.paciente?.dni?.toLowerCase() || ''
      return nombre.includes(termino) || dni.includes(termino)
    })

  function formatearFecha(fecha) {
    if (!fecha) return '—'
    const [anio, mes, dia] = fecha.split('-')
    return `${dia}/${mes}/${anio}`
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar rol="recepcionista" />

      <div className="flex-1 px-4 py-8 pt-16 md:pt-8 md:ml-64">

        {/* Encabezado */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(getRutaVolver())}
              className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-800 text-sm font-medium px-3 py-1.5 rounded-lg shadow-sm transition"
            >
              <span className="text-base">←</span>
              <span>Volver</span>
            </button>
            <h2 className="text-2xl font-bold text-gray-800">📅 Gestión de Citas</h2>
          </div>
          {vista === 'lista' && (
            <button
              onClick={() => { setCitaSeleccionada(null); setVista('nuevo') }}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              + Nueva cita
            </button>
          )}
        </div>

        {vista === 'nuevo' && (
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Programar nueva cita</h3>
            <FormularioCita
              onGuardar={handleGuardarNueva}
              onCancelar={() => setVista('lista')}
            />
          </div>
        )}

        {vista === 'reprogramar' && citaSeleccionada && (
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              Reprogramar cita
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Paciente: <strong>{citaSeleccionada.paciente?.apellido}, {citaSeleccionada.paciente?.nombre}</strong> — 
              DNI: {citaSeleccionada.paciente?.dni}
            </p>
            <FormularioCita
              citaInicial={{
                paciente_id: citaSeleccionada.paciente_id,
                odontologo_id: citaSeleccionada.odontologo_id,
                fecha: citaSeleccionada.fecha,
                hora: citaSeleccionada.hora?.slice(0, 5),
                motivo: citaSeleccionada.motivo,
              }}
              onGuardar={handleReprogramar}
              onCancelar={() => setVista('lista')}
            />
          </div>
        )}

        {vista === 'lista' && (
          <>
            {/* Buscador */}
            <div className="mb-4">
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="🔍 Buscar por nombre o DNI del paciente..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
              />
            </div>

            {/* Filtros de estado */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {['todas', 'programada', 'completada', 'cancelada'].map((estado) => (
                <button
                  key={estado}
                  onClick={() => setFiltroEstado(estado)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition capitalize ${
                    filtroEstado === estado
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {estado}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow overflow-hidden">
              {cargando ? (
                <p className="text-center text-gray-400 py-8">Cargando citas...</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 text-gray-600">Paciente</th>
                      <th className="text-left px-4 py-3 text-gray-600">Odontólogo</th>
                      <th className="text-left px-4 py-3 text-gray-600">Fecha</th>
                      <th className="text-left px-4 py-3 text-gray-600">Hora</th>
                      <th className="text-left px-4 py-3 text-gray-600">Estado</th>
                      <th className="text-left px-4 py-3 text-gray-600">Pago</th>
                      <th className="text-left px-4 py-3 text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citasFiltradas.map((c) => (
                      <tr key={c.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{c.paciente?.apellido}, {c.paciente?.nombre}</p>
                          <p className="text-xs text-gray-400">DNI: {c.paciente?.dni}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          Dr. {c.odontologo?.nombre} {c.odontologo?.apellido}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{formatearFecha(c.fecha)}</td>
                        <td className="px-4 py-3 text-gray-600">{c.hora?.slice(0, 5)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${COLORES_ESTADO[c.estado] || 'bg-gray-100 text-gray-600'}`}>
                            {c.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {c.pagado ? (
                            <span className="text-xs text-teal-600 font-medium">
                              💳 S/ 20.00
                              {c.reembolsado && <span className="ml-1 text-green-600">(reembolsado)</span>}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Presencial</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {c.estado === 'programada' && (
                              <>
                                <button
                                  onClick={() => { setCitaSeleccionada(c); setVista('reprogramar') }}
                                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs px-2 py-1 rounded-lg"
                                >
                                  📅 Reprogramar
                                </button>
                                <button
                                  onClick={() => handleCancelar(c.id)}
                                  className="bg-red-100 hover:bg-red-200 text-red-700 text-xs px-2 py-1 rounded-lg"
                                >
                                  ❌ Cancelar
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {!cargando && citasFiltradas.length === 0 && (
                <p className="text-center text-gray-400 py-8">
                  No hay citas {filtroEstado !== 'todas' ? `con estado "${filtroEstado}"` : ''}
                  {busqueda && ` para "${busqueda}"`}
                </p>
              )}
            </div>

            <p className="text-sm text-gray-400 mt-3">Total: {citasFiltradas.length} cita(s)</p>
          </>
        )}
      </div>
    </div>
  )
}