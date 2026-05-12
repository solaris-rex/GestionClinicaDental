// src/pages/Dashboard.jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { perfil, cargando } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Esperar a que termine de cargar
    if (cargando) return

    // Si no hay perfil después de cargar, ir al login
    if (!perfil) {
      navigate('/login')
      return
    }

    if (perfil.rol === 'administrador') navigate('/admin')
    else if (perfil.rol === 'recepcionista') navigate('/recepcionista')
    else if (perfil.rol === 'odontologo') navigate('/odontologo')
    else if (perfil.rol === 'paciente') navigate('/')
    else navigate('/login') // rol desconocido
  }, [perfil, cargando])

  return (
    <div className="min-h-screen flex items-center justify-center bg-teal-50">
      <p className="text-teal-600 font-medium animate-pulse">Cargando panel...</p>
    </div>
  )
}