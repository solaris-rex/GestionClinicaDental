// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Login from './pages/auth/Login'
import Registro from './pages/auth/Registro'
import Dashboard from './pages/Dashboard'
import PanelAdmin from './pages/admin/PanelAdmin'
import PanelRecepcionista from './pages/recepcionista/PanelRecepcionista'
import PanelOdontologo from './pages/odontologo/PanelOdontologo'
import PanelPaciente from './pages/paciente/PanelPaciente'
import GestionPacientes from './pages/recepcionista/GestionPacientes'
import GestionCitas from './pages/recepcionista/GestionCitas'

// Protege rutas: si no hay sesión, redirige al login
function RutaProtegida({ children }) {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <p className="text-blue-600 font-medium animate-pulse">Cargando...</p>
      </div>
    )
  }

  return usuario ? children : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      {/* Rutas protegidas */}
      <Route path="/dashboard" element={<RutaProtegida><Dashboard /></RutaProtegida>} />
      <Route path="/admin" element={<RutaProtegida><PanelAdmin /></RutaProtegida>} />
      <Route path="/recepcionista" element={<RutaProtegida><PanelRecepcionista /></RutaProtegida>} />
      <Route path="/odontologo" element={<RutaProtegida><PanelOdontologo /></RutaProtegida>} />
      <Route path="/paciente" element={<RutaProtegida><PanelPaciente /></RutaProtegida>} />
      <Route path="/pacientes" element={<RutaProtegida><GestionPacientes /></RutaProtegida>} />
      <Route path="/citas" element={<RutaProtegida><GestionCitas /></RutaProtegida>} />

      {/* Ruta raíz */}
      <Route path="/" element={<Navigate to="/login" />} />
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