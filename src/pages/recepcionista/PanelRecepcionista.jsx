// src/pages/recepcionista/PanelRecepcionista.jsx
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../../components/layout/Sidebar'

export default function PanelRecepcionista() {
  const navigate = useNavigate()
  const { perfil, cerrarSesion } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar rol="recepcionista" />

      {/* Contenido con margen del sidebar fijo */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">

        {/* Header */}
        <div className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Panel Recepcionista</h1>
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Foto */}
            {perfil?.avatar_url ? (
              <img src={perfil.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full object-cover border-2 border-green-500" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                {perfil?.nombre?.charAt(0)}{perfil?.apellido?.charAt(0)}
              </div>
            )}
            
            {/* Nombre y rol alineados a la izquierda */}
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">¡Hola, {perfil?.nombre}! 👋</p>
              <p className="text-xs text-gray-400 capitalize">{perfil?.rol}</p>
            </div>

            {/* Botón con contorno rojo */}
            <button
              onClick={cerrarSesion}
              className="border border-red-400 text-red-500 hover:bg-red-50 hover:border-red-500 text-xs font-medium px-3 py-1.5 rounded-lg transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-10">
          <h2 className="text-3xl font-bold mb-1">Bienvenida, {perfil?.nombre} 👋</h2>
          <p className="text-green-100">Gestiona pacientes y citas desde aquí</p>
        </div>

        {/* Contenido principal — flex-1 empuja el footer al fondo */}
        <div className="flex-1 px-8 py-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Accesos rápidos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <button
              onClick={() => navigate('/pacientes')}
              className="bg-white rounded-2xl shadow-sm p-6 text-left hover:shadow-md transition border-l-4 border-green-500 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-green-200 transition">
                  🏥
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800">Gestión de Pacientes</p>
                  <p className="text-sm text-gray-500">Registrar, buscar y editar pacientes</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/citas')}
              className="bg-white rounded-2xl shadow-sm p-6 text-left hover:shadow-md transition border-l-4 border-blue-500 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-blue-200 transition">
                  📅
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800">Gestión de Citas</p>
                  <p className="text-sm text-gray-500">Programar, confirmar y cancelar citas</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer — siempre al fondo */}
        <footer className="bg-gray-900 text-gray-400 py-6 px-8">
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