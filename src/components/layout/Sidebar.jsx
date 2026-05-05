// src/components/layout/Sidebar.jsx
import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

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
    { icono: '📅', label: 'Mis citas', ruta: '/paciente' },
    { icono: '➕', label: 'Solicitar cita', ruta: '/paciente' },
  ],
}

export default function Sidebar({ rol = 'publico' }) {
  const [abierto, setAbierto] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const { perfil, cerrarSesion } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const inputFoto = useRef(null)

  const menu = MENUS[rol] || MENUS.publico
  const esPublico = rol === 'publico'

  async function handleSubirFoto(e) {
    const archivo = e.target.files[0]
    if (!archivo || !perfil?.id) return

    setSubiendoFoto(true)
    try {
      const extension = archivo.name.split('.').pop()
      const nombreArchivo = `${perfil.id}.${extension}`

      const { error: errorSubida } = await supabase.storage
        .from('avatars')
        .upload(nombreArchivo, archivo, { upsert: true })

      if (errorSubida) throw errorSubida

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(nombreArchivo)

      await supabase
        .from('perfiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', perfil.id)

      window.location.reload()
    } catch (err) {
      console.error('Error subiendo foto:', err)
    } finally {
      setSubiendoFoto(false)
    }
  }

  function handleNavegar(item) {
    if (item.href) {
      const elemento = document.querySelector(item.href)
      if (elemento) elemento.scrollIntoView({ behavior: 'smooth' })
    } else if (item.ruta) {
      navigate(item.ruta)
    }
    setAbierto(false)
  }

  function estaActivo(item) {
    if (item.ruta) return location.pathname === item.ruta
    return false
  }

  // Si no hay sesión y no es una ruta pública, no renderizamos nada del componente
  if (!perfil && !esPublico) return null

  return (
    <>
      {/* Botón hamburguesa — Solo visible si hay sesión iniciada (perfil existe) */}
      {perfil && (
        <button
          onClick={() => setAbierto(!abierto)}
          className="fixed top-4 left-4 z-50 bg-white shadow-lg rounded-xl w-10 h-10 flex flex-col items-center justify-center gap-1.5 hover:bg-gray-50 transition"
        >
          <span className="w-5 h-0.5 bg-gray-700 block" />
          <span className="w-5 h-0.5 bg-gray-700 block" />
          <span className="w-5 h-0.5 bg-gray-700 block" />
        </button>
      )}

      {/* Overlay */}
      {abierto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setAbierto(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-64 z-50 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${abierto ? 'translate-x-0' : '-translate-x-full'}
        bg-gray-900 text-white shadow-2xl`}
      >
        {/* ===== HEADER DEL SIDEBAR ===== */}
        <div className="px-5 py-5 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🦷</span>
            <span className="font-bold text-white text-lg">DentaNovax</span>
          </div>
          <button
            onClick={() => setAbierto(false)}
            className="text-gray-400 hover:text-white transition text-lg"
          >
            ✕
          </button>
        </div>

        {/* ===== MENÚ CENTRAL ===== */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">

          {/* Volver a inicio — solo paneles internos */}
          {!esPublico && (
            <>
              <button
                onClick={() => { navigate('/'); setAbierto(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition text-sm"
              >
                <span className="text-base">🏠</span>
                <span>Inicio</span>
              </button>
              <div className="border-t border-gray-700 my-2" />
            </>
          )}

          {menu.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavegar(item)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition
                ${estaActivo(item)
                  ? 'bg-teal-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
            >
              <span className="text-base">{item.icono}</span>
              <span>{item.label}</span>
              {estaActivo(item) && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </button>
          ))}
        </nav>

        {/* ===== FOOTER DEL SIDEBAR — Info del usuario ===== */}
        <div className="border-t border-gray-700 p-4">
          {perfil ? (
            <div>
              {/* Foto y datos del usuario */}
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  {perfil.avatar_url ? (
                    <img
                      src={perfil.avatar_url}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover border-2 border-teal-500"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
                      {perfil.nombre?.charAt(0)}{perfil.apellido?.charAt(0)}
                    </div>
                  )}
                  {/* Botón cambiar foto */}
                  <button
                    onClick={() => inputFoto.current?.click()}
                    className="absolute -bottom-0.5 -right-0.5 bg-gray-700 hover:bg-teal-600 rounded-full w-4 h-4 flex items-center justify-center text-xs transition"
                    title="Cambiar foto"
                  >
                    📷
                  </button>
                  <input
                    type="file"
                    ref={inputFoto}
                    onChange={handleSubirFoto}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    {perfil.nombre} {perfil.apellido}
                  </p>
                  <p className="text-gray-400 text-xs truncate">
                    {perfil.email || perfil.rol}
                  </p>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="space-y-1">
                <button
                  onClick={() => { navigate('/perfil'); setAbierto(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition text-xs"
                >
                  <span>⚙️</span>
                  <span>Editar perfil</span>
                </button>
                <button
                  onClick={() => { cerrarSesion(); setAbierto(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-900 hover:bg-opacity-30 hover:text-red-300 transition text-xs"
                >
                  <span>🚪</span>
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { navigate('/login'); setAbierto(false) }}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium transition text-sm"
            >
              <span>🔐</span>
              <span>Iniciar sesión</span>
            </button>
          )}

          {subiendoFoto && (
            <p className="text-xs text-teal-400 text-center mt-2 animate-pulse">
              Subiendo foto...
            </p>
          )}
        </div>
      </div>
    </>
  )
}