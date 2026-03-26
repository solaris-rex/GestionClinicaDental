// src/components/layout/Navbar.jsx
// Barra de navegación superior que aparece en todos los paneles.
// Muestra el nombre del usuario, su rol y el botón de cerrar sesión.

import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { perfil, cerrarSesion } = useAuth()

  const coloresPorRol = {
    administrador: 'bg-purple-700',
    recepcionista: 'bg-green-700',
    odontologo: 'bg-blue-700',
    paciente: 'bg-orange-600',
  }

  const color = coloresPorRol[perfil?.rol] || 'bg-blue-700'

  return (
    <nav className={`${color} text-white px-6 py-3 flex justify-between items-center shadow`}>
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold">🦷 ClinicaDental</span>
        <span className="text-sm bg-white bg-opacity-20 px-2 py-0.5 rounded-full ml-2">
          {perfil?.rol}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm">
          {perfil?.nombre} {perfil?.apellido}
        </span>
        <button
          onClick={cerrarSesion}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm px-3 py-1 rounded-lg transition"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  )
}