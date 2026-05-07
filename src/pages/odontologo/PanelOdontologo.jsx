// src/pages/odontologo/PanelOdontologo.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../../components/layout/Sidebar'
import { obtenerCitasPorOdontologo } from '../../services/citasService'
import { useNavigate } from 'react-router-dom'

const COLORES_ESTADO = {
  programada: 'bg-blue-100 text-blue-700',
  confirmada: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
  completada: 'bg-gray-100 text-gray-600',
}

export default function PanelOdontologo() {
  const navigate = useNavigate()
  const { perfil, cerrarSesion } = useAuth()
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
  const citasHoy = citas.filter(c => c.fecha === hoy && c.estado !== 'cancelada')
  const citasProximas = citas.filter(c => c.fecha > hoy && c.estado !== 'cancelada')

  function formatearFecha(fecha) {
    if (!fecha) return '—'
    const [anio, mes, dia] = fecha.split('-')
    return `${dia}/${mes}/${anio}`
  }

  function obtenerDiaSemana(fecha) {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    return dias[new Date(fecha + 'T00:00:00').getDay()]
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar rol="odontologo" />

      <div className="flex-1 ml-64">

        {/* Header */}
        <div className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Panel Recepcionista</h1>
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* ⚙️ a la izquierda de la foto */}
            <button
              onClick={() => navigate('/perfil')}
              className="text-gray-400 hover:text-gray-600 transition text-lg"
              title="Editar perfil"
            >
              ⚙️
            </button>
            {/* Foto */}
            {perfil?.avatar_url ? (
              <img src={perfil.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full object-cover border-2 border-green-500" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                {perfil?.nombre?.charAt(0)}{perfil?.apellido?.charAt(0)}
              </div>
            )}
            {/* Nombre, rol y cerrar sesión */}
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-800">¡Hola, {perfil?.nombre}! 👋</p>
                <button
                  onClick={cerrarSesion}
                  className="text-xs text-red-500 hover:text-red-700 transition font-medium"
                >
                  Cerrar sesión
                </button>
              </div>
              <p className="text-xs text-gray-400 capitalize">{perfil?.rol}</p>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-8 py-10">
          <h2 className="text-3xl font-bold mb-1">
            Bienvenido, Dr. {perfil?.nombre} {perfil?.apellido} 👨‍⚕️
          </h2>
          <p className="text-blue-200">
            {obtenerDiaSemana(hoy)}, {formatearFecha(hoy)}
          </p>
        </div>

        <div className="px-8 py-8">

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl shadow-sm p-6 text-center border-t-4 border-blue-500">
              <p className="text-4xl font-bold text-blue-600">{citasHoy.length}</p>
              <p className="text-gray-500 mt-1 text-sm">Citas hoy</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6 text-center border-t-4 border-green-400">
              <p className="text-4xl font-bold text-green-600">{citasProximas.length}</p>
              <p className="text-gray-500 mt-1 text-sm">Próximas citas</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6 text-center border-t-4 border-gray-300">
              <p className="text-4xl font-bold text-gray-600">
                {citas.filter(c => c.estado === 'completada').length}
              </p>
              <p className="text-gray-500 mt-1 text-sm">Completadas</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {[
              { key: 'hoy', label: '📅 Agenda de hoy' },
              { key: 'proximas', label: '🗓️ Próximas citas' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setVistaActiva(tab.key)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition ${
                  vistaActiva === tab.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Agenda hoy */}
          {vistaActiva === 'hoy' && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h3 className="font-bold text-gray-800">Citas de hoy</h3>
              </div>
              {cargando ? (
                <p className="text-center text-gray-400 py-8 animate-pulse">Cargando agenda...</p>
              ) : citasHoy.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-5xl mb-3">🎉</p>
                  <p className="text-gray-500 font-medium">No tienes citas programadas para hoy</p>
                </div>
              ) : (
                <div className="divide-y">
                  {citasHoy.sort((a, b) => a.hora.localeCompare(b.hora)).map((cita) => (
                    <div key={cita.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition">
                      <div className="bg-blue-50 rounded-xl p-3 text-center min-w-16">
                        <p className="text-lg font-bold text-blue-700">{cita.hora?.slice(0, 5)}</p>
                        <p className="text-xs text-blue-500">hrs</p>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          {cita.paciente?.apellido}, {cita.paciente?.nombre}
                        </p>
                        <p className="text-sm text-gray-500">DNI: {cita.paciente?.dni}</p>
                        {cita.motivo && <p className="text-sm text-gray-400 mt-1">📋 {cita.motivo}</p>}
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

          {/* Próximas citas */}
          {vistaActiva === 'proximas' && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h3 className="font-bold text-gray-800">Próximas citas agendadas</h3>
              </div>
              {cargando ? (
                <p className="text-center text-gray-400 py-8 animate-pulse">Cargando...</p>
              ) : citasProximas.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-5xl mb-3">📭</p>
                  <p className="text-gray-500 font-medium">No tienes citas próximas agendadas</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 text-gray-600">Fecha</th>
                      <th className="text-left px-6 py-3 text-gray-600">Hora</th>
                      <th className="text-left px-6 py-3 text-gray-600">Paciente</th>
                      <th className="text-left px-6 py-3 text-gray-600">Motivo</th>
                      <th className="text-left px-6 py-3 text-gray-600">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citasProximas.map((cita) => (
                      <tr key={cita.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-800">{formatearFecha(cita.fecha)}</p>
                          <p className="text-xs text-gray-400">{obtenerDiaSemana(cita.fecha)}</p>
                        </td>
                        <td className="px-6 py-4 font-medium text-blue-700">{cita.hora?.slice(0, 5)}</td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-800">{cita.paciente?.apellido}, {cita.paciente?.nombre}</p>
                          <p className="text-xs text-gray-400">DNI: {cita.paciente?.dni}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{cita.motivo || '—'}</td>
                        <td className="px-6 py-4">
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

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-6 px-8 mt-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span>🦷</span>
              <span className="text-white font-semibold">DentaNovax</span>
            </div>
            <p>© 2026 DentaNovax. Todos los derechos reservados.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}