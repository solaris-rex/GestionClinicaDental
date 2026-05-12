import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const MENUS = {
  publico: [
    { icono: '🏠', label: 'Inicio', href: '#inicio' },
    { icono: '🔧', label: 'Servicios', href: '#servicios' },
    { icono: '👥', label: 'Nosotros', href: '#nosotros' },
    { icono: '📞', label: 'Contacto', href: '#contacto' },
  ],
  administrador: [
    { icono: '👥', label: 'Gestión de usuarios', ruta: '/admin' },
    { icono: '🏥', label: 'Ver pacientes', ruta: '/pacientes' },
    { icono: '📅', label: 'Ver citas', ruta: '/citas' },
  ],
  recepcionista: [
    { icono: '🏥', label: 'Gestión de pacientes', ruta: '/pacientes' },
    { icono: '📅', label: 'Gestión de citas', ruta: '/citas' },
  ],
  odontologo: [
    { icono: '📅', label: 'Mi agenda', ruta: '/odontologo' },
    { icono: '🗓️', label: 'Próximas citas', ruta: '/odontologo' },
  ],
  paciente: [
    { icono: '📅', label: 'Mis citas', ruta: '/paciente?vista=lista' },
    { icono: '➕', label: 'Solicitar cita', ruta: '/paciente?vista=nueva' },
  ],
}

const ROLES_FIJOS = ['administrador', 'recepcionista', 'odontologo']

export default function Sidebar({ rol = 'publico' }) {
  const [abierto, setAbierto] = useState(false)
  const { perfil, cerrarSesion } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const esPublico = rol === 'publico'
  const esFijo = ROLES_FIJOS.includes(rol)

  const menuPublico = MENUS.publico
  const menuPersonal = perfil?.rol ? MENUS[perfil.rol] : null
  const menu = esFijo ? (MENUS[rol] || []) : (MENUS[rol] || MENUS.publico)

  function handleNavegar(item) {
    if (item.href) {
      const elemento = document.querySelector(item.href)
      if (elemento) elemento.scrollIntoView({ behavior: 'smooth' })
    } else if (item.ruta) {
      const origenPorRol = {
        administrador: '/admin',
        recepcionista: '/recepcionista',
      }
      const from = origenPorRol[rol]
      navigate(item.ruta, { state: { from: from || null } })
    }
    if (!esFijo) setAbierto(false)
  }

  function estaActivo(item) {
    if (item.ruta) {
      const rutaBase = item.ruta.split('?')[0]
      return location.pathname === rutaBase
    }
    return false
  }

  if (!perfil && !esPublico) return null

  const mostrarBoton = perfil !== null || !esPublico

  // ===== SIDEBAR FIJO para Admin, Recep, Odontólogo =====
  if (esFijo) {
    return (
      <div className="fixed top-0 left-0 h-full w-64 z-40 flex flex-col bg-gray-900 text-white shadow-2xl">
        <div className="px-5 py-5 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🦷</span>
            <span className="font-bold text-white text-lg">DentaNovax</span>
          </div>
          {perfil && (
            <div className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
              {perfil.avatar_url ? (
                <img src={perfil.avatar_url} alt="Avatar"
                  className="w-9 h-9 rounded-full object-cover border-2 border-teal-500" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
                  {perfil.nombre?.charAt(0)}{perfil.apellido?.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">{perfil.nombre} {perfil.apellido}</p>
                <p className="text-gray-400 text-xs capitalize">{perfil.rol}</p>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menu.map((item) => (
            <button key={item.label} onClick={() => handleNavegar(item)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition
                ${estaActivo(item) ? 'bg-teal-600 text-white font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <span>{item.icono}</span>
              <span>{item.label}</span>
              {estaActivo(item) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
            </button>
          ))}
        </nav>

        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div>
              {perfil?.avatar_url ? (
                <img src={perfil.avatar_url} alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-teal-500" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
                  {perfil?.nombre?.charAt(0)}{perfil?.apellido?.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{perfil?.nombre} {perfil?.apellido}</p>
              <p className="text-gray-400 text-xs truncate">{perfil?.email || perfil?.rol}</p>
            </div>
          </div>
          <div className="space-y-1">
            <button onClick={() => navigate('/perfil')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition text-xs">
              <span>⚙️</span><span>Editar perfil</span>
            </button>
            <button onClick={cerrarSesion}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-900 hover:bg-opacity-30 transition text-xs">
              <span>🚪</span><span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ===== SIDEBAR COLAPSABLE para Landing y Paciente =====
  if (!mostrarBoton) return null

  return (
    <>
      <button
        onClick={() => setAbierto(!abierto)}
        className="fixed top-3 left-4 z-50 bg-white shadow-lg rounded-xl w-10 h-10 flex flex-col items-center justify-center gap-1.5 hover:bg-gray-0 transition"
      >
        <span className="w-5 h-0.5 bg-gray-700 block" />
        <span className="w-5 h-0.5 bg-gray-700 block" />
        <span className="w-5 h-0.5 bg-gray-700 block" />
      </button>

      {abierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setAbierto(false)} />
      )}

      <div className={`fixed top-0 left-0 h-full w-64 z-50 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${abierto ? 'translate-x-0' : '-translate-x-full'}
        bg-gray-900 text-white shadow-2xl`}
      >
        <div className="px-5 py-5 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🦷</span>
            <span className="font-bold text-white text-lg">DentaNovax</span>
          </div>
          <button onClick={() => setAbierto(false)} className="text-gray-400 hover:text-white transition text-lg">✕</button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {esPublico && (
            <>
              {menuPublico.map((item) => (
                <button key={item.label} onClick={() => handleNavegar(item)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition text-sm">
                  <span>{item.icono}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </>
          )}

          {esPublico && menuPersonal && menuPersonal.length > 0 && (
            <>
              <div className="border-t border-gray-700 my-2" />
              <p className="px-4 py-1 text-xs text-gray-500 uppercase tracking-wider font-semibold">
                Mi gestión
              </p>
              {menuPersonal.map((item) => (
                <button key={item.label} onClick={() => handleNavegar(item)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition
                    ${estaActivo(item) ? 'bg-teal-600 text-white font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                  <span>{item.icono}</span>
                  <span>{item.label}</span>
                  {estaActivo(item) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
                </button>
              ))}
            </>
          )}

          {!esPublico && (
            <>
              <button onClick={() => { navigate('/'); setAbierto(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition text-sm">
                <span>🏠</span><span>Inicio</span>
              </button>
              <div className="border-t border-gray-700 my-2" />
              {menu.map((item) => (
                <button key={item.label} onClick={() => handleNavegar(item)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition
                    ${estaActivo(item) ? 'bg-teal-600 text-white font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                  <span>{item.icono}</span>
                  <span>{item.label}</span>
                  {estaActivo(item) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
                </button>
              ))}
            </>
          )}
        </nav>

        <div className="border-t border-gray-700 p-4">
          {perfil ? (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div>
                  {perfil.avatar_url ? (
                    <img src={perfil.avatar_url} alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover border-2 border-teal-500" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
                      {perfil.nombre?.charAt(0)}{perfil.apellido?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{perfil.nombre} {perfil.apellido}</p>
                  <p className="text-gray-400 text-xs truncate capitalize">{perfil.rol}</p>
                </div>
              </div>
              <div className="space-y-1">
                <button onClick={() => { navigate('/perfil'); setAbierto(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition text-xs">
                  <span>⚙️</span><span>Editar perfil</span>
                </button>
                <button onClick={() => { cerrarSesion(); setAbierto(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-900 hover:bg-opacity-30 transition text-xs">
                  <span>🚪</span><span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => { navigate('/login'); setAbierto(false) }}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium transition text-sm">
              <span>🔐</span><span>Iniciar sesión</span>
            </button>
          )}
        </div>
      </div>
    </>
  )
}