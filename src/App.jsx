// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Registro from './pages/auth/Registro'
import Dashboard from './pages/Dashboard'
import PanelAdmin from './pages/admin/PanelAdmin'
import PanelRecepcionista from './pages/recepcionista/PanelRecepcionista'
import PanelOdontologo from './pages/odontologo/PanelOdontologo'
import PanelPaciente from './pages/paciente/PanelPaciente'
import GestionPacientes from './pages/recepcionista/GestionPacientes'
import GestionCitas from './pages/recepcionista/GestionCitas'
import EditarPerfil from './pages/perfil/EditarPerfil'

// Pantalla de acceso denegado
function AccesoDenegado() {
  const { cerrarSesion, perfil } = useAuth()
  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
        <p className="text-5xl mb-4">🚫</p>
        <h2 className="text-2xl font-bold text-red-600 mb-2">Acceso denegado</h2>
        <p className="text-gray-500 mb-6">
          No tienes permisos para ver esta página.
          Tu rol es <span className="font-semibold text-gray-700">{perfil?.rol}</span>.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition"
          >
            ← Volver
          </button>
          <button
            onClick={cerrarSesion}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}

// Protege rutas: verifica sesión activa
function RutaProtegida({ children, rolesPermitidos }) {
  const { usuario, perfil, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <p className="text-blue-600 font-medium animate-pulse">Cargando...</p>
      </div>
    )
  }

  if (!usuario) return <Navigate to="/login" />

  if (rolesPermitidos && perfil && !rolesPermitidos.includes(perfil.rol)) {
    return <AccesoDenegado />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Ruta raíz: Landing page */}
      <Route path="/" element={<Landing />} />

      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      {/* Dashboard: redirige según rol */}
      <Route path="/dashboard" element={
        <RutaProtegida>
          <Dashboard />
        </RutaProtegida>
      } />

      {/* Solo administrador */}
      <Route path="/admin" element={
        <RutaProtegida rolesPermitidos={['administrador']}>
          <PanelAdmin />
        </RutaProtegida>
      } />

      {/* Solo recepcionista y administrador */}
      <Route path="/recepcionista" element={
        <RutaProtegida rolesPermitidos={['recepcionista', 'administrador']}>
          <PanelRecepcionista />
        </RutaProtegida>
      } />

      <Route path="/pacientes" element={
        <RutaProtegida rolesPermitidos={['recepcionista', 'administrador']}>
          <GestionPacientes />
        </RutaProtegida>
      } />

      <Route path="/citas" element={
        <RutaProtegida rolesPermitidos={['recepcionista', 'administrador']}>
          <GestionCitas />
        </RutaProtegida>
      } />

      {/* Solo odontólogo y administrador */}
      <Route path="/odontologo" element={
        <RutaProtegida rolesPermitidos={['odontologo', 'administrador']}>
          <PanelOdontologo />
        </RutaProtegida>
      } />

      {/* Solo paciente y administrador */}
      <Route path="/paciente" element={
        <RutaProtegida rolesPermitidos={['paciente', 'administrador']}>
          <PanelPaciente />
        </RutaProtegida>
      } />

      // Agrega la ruta protegida
      <Route path="/perfil" element={
        <RutaProtegida>
          <EditarPerfil />
        </RutaProtegida>
      } />

      {/* Cualquier ruta no encontrada → Landing */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}