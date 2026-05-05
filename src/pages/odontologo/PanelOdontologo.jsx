// src/pages/odontologo/PanelOdontologo.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/layout/Sidebar'
import { useAuth } from '../../context/AuthContext'
import { obtenerCitasPorOdontologo } from '../../services/citasService'

const COLORES_ESTADO = {
  programada: 'bg-blue-100 text-blue-700',
  confirmada: 'bg-green-100 text-green-700',
  cancelada:  'bg-red-100 text-red-700',
  completada: 'bg-gray-100 text-gray-600',
}

export default function PanelOdontologo() {
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const [citas, setCitas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [vistaActiva, setVistaActiva] = useState('hoy')

  useEffect(() => {
    if (perfil?.id) cargarCitas()
  }, [perfil])

  async function cargarCitas() {
    setCargando(true)
    const { data } = await obtenerCitasPorOdontologo(perfil.id)
    setCitas(data || [])
    setCargando(false)
  }

  const hoy = new Date().toISOString().split('T')[0]

  const citasHoy = citas.filter(
    (c) => c.fecha === hoy && c.estado !== 'cancelada'
  )

  const citasProximas = citas.filter(
    (c) => c.fecha > hoy && c.estado !== 'cancelada'
  )

  function formatearFecha(fecha) {
    if (!fecha) return '—'
    const [anio, mes, dia] = fecha.split('-')
    return `${dia}/${mes}/${anio}`
  }

  function formatearHora(hora) {
    return hora?.slice(0, 5) || '—'
  }

  function obtenerDiaSemana(fecha) {
    const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
    const d = new Date(fecha + 'T00:00:00')
    return dias[d.getDay()]
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* Sidebar */}
      <Sidebar rol="odontologo" />

      {/* Contenido */}
      <div className="flex-1 px-4 py-8 pt-16 md:pt-8 md:ml-64">

        {/* Encabezado */}
        <div className="bg-blue-700 text-white rounded-2xl p-6 mb-6 shadow">
          <h2 className="text-2xl font-bold">
            👨‍⚕️ Bienvenido, Dr. {perfil?.nombre} {perfil?.apellido}
          </h2>
          <p className="text-blue-200 mt-1 text-sm">
            Hoy es {obtenerDiaSemana(hoy)}, {formatearFecha(hoy)}
          </p>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-blue-700">{citasHoy.length}</p>
            <p className="text-sm text-gray-500 mt-1">Citas hoy</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{citasProximas.length}</p>
            <p className="text-sm text-gray-500 mt-1">Próximas citas</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-gray-700">
              {citas.filter((c) => c.estado === 'completada').length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Citas completadas</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setVistaActiva('hoy')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              vistaActiva === 'hoy'
                ? 'bg-blue-700 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            📅 Agenda de hoy
          </button>

          <button
            onClick={() => setVistaActiva('proximas')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              vistaActiva === 'proximas'
                ? 'bg-blue-700 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            🗓️ Próximas citas
          </button>
        </div>

        {/* Hoy */}
        {vistaActiva === 'hoy' && (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-800">
                Citas programadas para hoy
              </h3>
            </div>

            {cargando ? (
              <p className="text-center text-gray-400 py-8">Cargando agenda...</p>
            ) : citasHoy.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">🎉</p>
                <p className="text-gray-500 font-medium">
                  No tienes citas programadas para hoy
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {citasHoy
                  .sort((a, b) => a.hora.localeCompare(b.hora))
                  .map((cita) => (
                    <div
                      key={cita.id}
                      className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="w-16 text-center">
                        <span className="text-lg font-bold text-blue-700">
                          {formatearHora(cita.hora)}
                        </span>
                      </div>

                      <div className="w-px h-12 bg-gray-200 mx-4" />

                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          {cita.paciente?.apellido}, {cita.paciente?.nombre}
                        </p>
                        <p className="text-sm text-gray-500">
                          DNI: {cita.paciente?.dni}
                        </p>
                        {cita.motivo && (
                          <p className="text-sm text-gray-400 mt-1">
                            📋 {cita.motivo}
                          </p>
                        )}
                      </div>

                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${COLORES_ESTADO[cita.estado]}`}>
                        {cita.estado}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Próximas */}
        {vistaActiva === 'proximas' && (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-800">
                Próximas citas agendadas
              </h3>
            </div>

            {cargando ? (
              <p className="text-center text-gray-400 py-8">Cargando citas...</p>
            ) : citasProximas.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-gray-500 font-medium">
                  No tienes citas próximas agendadas
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600">Fecha</th>
                    <th className="text-left px-4 py-3 text-gray-600">Hora</th>
                    <th className="text-left px-4 py-3 text-gray-600">Paciente</th>
                    <th className="text-left px-4 py-3 text-gray-600">Motivo</th>
                    <th className="text-left px-4 py-3 text-gray-600">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {citasProximas.map((cita) => (
                    <tr key={cita.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">
                          {formatearFecha(cita.fecha)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {obtenerDiaSemana(cita.fecha)}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-medium text-blue-700">
                        {formatearHora(cita.hora)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">
                          {cita.paciente?.apellido}, {cita.paciente?.nombre}
                        </p>
                        <p className="text-xs text-gray-400">
                          DNI: {cita.paciente?.dni}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {cita.motivo || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${COLORES_ESTADO[cita.estado]}`}>
                          {cita.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </div>
  )
}