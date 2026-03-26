// src/pages/Dashboard.jsx
// Este componente actúa como un "enrutador por rol".
// Según el rol del usuario, redirige al panel correspondiente.

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { perfil, cargando } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (cargando) return

    // Redirigir según el rol del usuario
    if (perfil?.rol === 'administrador') navigate('/admin')
    else if (perfil?.rol === 'recepcionista') navigate('/recepcionista')
    else if (perfil?.rol === 'odontologo') navigate('/odontologo')
    else if (perfil?.rol === 'paciente') navigate('/paciente')
  }, [perfil, cargando])

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <p className="text-blue-600 font-medium animate-pulse">
        Cargando panel...
      </p>
    </div>
  )
}