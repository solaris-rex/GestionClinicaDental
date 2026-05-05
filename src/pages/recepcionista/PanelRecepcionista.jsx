// src/pages/recepcionista/PanelRecepcionista.jsx
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/layout/Sidebar'

export default function PanelRecepcionista() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* Sidebar */}
      <Sidebar rol="recepcionista" />

      {/* Contenido */}
      <div className="flex-1 px-4 py-8 pt-16 md:pt-8 md:ml-64">

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          📋 Panel Recepcionista
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/pacientes')}
            className="bg-white hover:bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-left transition shadow"
          >
            <p className="text-3xl mb-2">🏥</p>
            <p className="text-lg font-semibold text-gray-800">Gestión de Pacientes</p>
            <p className="text-sm text-gray-500">Registrar, buscar y editar pacientes</p>
          </button>

          <button
            onClick={() => navigate('/citas')}
            className="bg-white hover:bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 text-left transition shadow"
          >
            <p className="text-3xl mb-2">📅</p>
            <p className="text-lg font-semibold text-gray-800">Gestión de Citas</p>
            <p className="text-sm text-gray-500">Programar, confirmar y cancelar citas</p>
          </button>
        </div>

      </div>
    </div>
  )
}