// src/pages/recepcionista/GestionCitas.jsx
import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
  confirmada: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
  completada: 'bg-gray-100 text-gray-600',
}

export default function GestionCitas() {
  const navigate = useNavigate()
  const location = useLocation()
  const { perfil } = useAuth()
  const [citas, setCitas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [vista, setVista] = useState('lista')
  const [citaSeleccionada, setCitaSeleccionada] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('todas')

  useEffect(() => { cargarCitas() }, [])

  // Determinar a dónde volver según el rol o el state
  function getRutaVolver() {
    if (perfil?.rol === 'administrador') return '/admin'
    return '/recepcionista'
  }

  async function cargarCitas() {
    setCargando(true)
    const { data } = await obtenerCitas()
    setCitas(data || [])
    setCargando(false)
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
      form.hora + ':00'
    )
    if (!resultado.error) {
      await cargarCitas()
      setVista('lista')
    }
    return resultado
  }

  async function handleCambiarEstado(id, nuevoEstado) {
    await actualizarEstadoCita(id, nuevoEstado)
    await cargarCitas()
  }

  const citasFiltradas =
    filtroEstado === 'todas'
      ? citas
      : citas.filter((c) => c.estado === filtroEstado)

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
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Reprogramar cita — {citaSeleccionada.paciente?.nombre} {citaSeleccionada.paciente?.apellido}
            </h3>
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
            <div className="flex gap-2 mb-4 flex-wrap">
              {['todas', 'programada', 'confirmada', 'cancelada', 'completada'].map((estado) => (
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
                        <td className="px-4 py-3 text-gray-600">Dr. {c.odontologo?.nombre} {c.odontologo?.apellido}</td>
                        <td className="px-4 py-3 text-gray-600">{formatearFecha(c.fecha)}</td>
                        <td className="px-4 py-3 text-gray-600">{c.hora?.slice(0, 5)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${COLORES_ESTADO[c.estado]}`}>
                            {c.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {c.estado !== 'cancelada' && c.estado !== 'completada' && (
                              <button
                                onClick={() => { setCitaSeleccionada(c); setVista('reprogramar') }}
                                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs px-2 py-1 rounded-lg"
                              >
                                📅 Reprogramar
                              </button>
                            )}
                            {c.estado === 'programada' && (
                              <button
                                onClick={() => handleCambiarEstado(c.id, 'confirmada')}
                                className="bg-green-100 hover:bg-green-200 text-green-700 text-xs px-2 py-1 rounded-lg"
                              >
                                ✅ Confirmar
                              </button>
                            )}
                            {c.estado === 'confirmada' && (
                              <button
                                onClick={() => handleCambiarEstado(c.id, 'completada')}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-lg"
                              >
                                🏁 Completar
                              </button>
                            )}
                            {c.estado !== 'cancelada' && c.estado !== 'completada' && (
                              <button
                                onClick={() => handleCambiarEstado(c.id, 'cancelada')}
                                className="bg-red-100 hover:bg-red-200 text-red-700 text-xs px-2 py-1 rounded-lg"
                              >
                                ❌ Cancelar
                              </button>
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