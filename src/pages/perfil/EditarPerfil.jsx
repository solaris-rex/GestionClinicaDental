// src/pages/perfil/EditarPerfil.jsx
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/layout/Sidebar'

export default function EditarPerfil() {
  const { perfil, cerrarSesion } = useAuth()
  const navigate = useNavigate()
  const inputFoto = useRef(null)

  const esPaciente = perfil?.rol === 'paciente'
  const ROLES_FIJOS = ['administrador', 'recepcionista', 'odontologo']
  const tieneSidebarFijo = ROLES_FIJOS.includes(perfil?.rol)

  const [form, setForm] = useState({
    nombre: perfil?.nombre || '',
    apellido: perfil?.apellido || '',
    telefono: perfil?.telefono || '',
  })
  const [passwordForm, setPasswordForm] = useState({
    actual: '',
    nueva: '',
    confirmar: '',
  })
  const [guardando, setGuardando] = useState(false)
  const [guardandoPass, setGuardandoPass] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [exito, setExito] = useState('')
  const [exitoPass, setExitoPass] = useState('')
  const [error, setError] = useState('')
  const [errorPass, setErrorPass] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(perfil?.avatar_url || null)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleChangePass(e) {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value })
  }

  async function handleGuardarPerfil(e) {
    e.preventDefault()
    setError('')
    setExito('')

    if (form.telefono && form.telefono.length !== 9) {
      setError('El teléfono debe tener exactamente 9 dígitos.')
      return
    }

    setGuardando(true)
    const { error: err } = await supabase
      .from('perfiles')
      .update({ nombre: form.nombre, apellido: form.apellido, telefono: form.telefono })
      .eq('id', perfil.id)

    if (err) {
      setError('Error al guardar: ' + err.message)
    } else {
      setExito('✅ Perfil actualizado correctamente.')
      setTimeout(() => setExito(''), 3000)
    }
    setGuardando(false)
  }

  async function handleCambiarPassword(e) {
    e.preventDefault()
    setErrorPass('')
    setExitoPass('')

    if (!passwordForm.actual) {
      setErrorPass('Ingresa tu contraseña actual.')
      return
    }
    if (passwordForm.nueva.length < 8) {
      setErrorPass('La contraseña debe tener mínimo 8 caracteres.')
      return
    }
    if (!/[A-Z]/.test(passwordForm.nueva)) {
      setErrorPass('Debe contener al menos una mayúscula.')
      return
    }
    if (!/\d.*\d/.test(passwordForm.nueva)) {
      setErrorPass('Debe contener al menos 2 números.')
      return
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordForm.nueva)) {
      setErrorPass('Debe contener al menos un carácter especial.')
      return
    }
    if (passwordForm.nueva !== passwordForm.confirmar) {
      setErrorPass('Las contraseñas no coinciden.')
      return
    }

    setGuardandoPass(true)

    // Verificar contraseña actual re-autenticando
    const { data: userData } = await supabase.auth.getUser()
    const email = userData?.user?.email

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password: passwordForm.actual,
    })

    if (loginError) {
      setErrorPass('La contraseña actual es incorrecta.')
      setGuardandoPass(false)
      return
    }

    const { error: err } = await supabase.auth.updateUser({
      password: passwordForm.nueva,
    })

    if (err) {
      setErrorPass('Error al cambiar contraseña: ' + err.message)
    } else {
      setExitoPass('✅ Contraseña actualizada correctamente.')
      setPasswordForm({ actual: '', nueva: '', confirmar: '' })
      setTimeout(() => setExitoPass(''), 3000)
    }
    setGuardandoPass(false)
  }

  async function handleSubirFoto(e) {
    const archivo = e.target.files[0]
    if (!archivo || !perfil?.id) return

    setSubiendoFoto(true)
    try {
      const reader = new FileReader()
      reader.onload = (ev) => setAvatarPreview(ev.target.result)
      reader.readAsDataURL(archivo)

      const extension = archivo.name.split('.').pop()
      const nombreArchivo = `${perfil.id}.${extension}`

      const { error: errorSubida } = await supabase.storage
        .from('avatars')
        .upload(nombreArchivo, archivo, { upsert: true })

      if (errorSubida) throw errorSubida

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(nombreArchivo)

      await supabase.from('perfiles').update({ avatar_url: urlData.publicUrl }).eq('id', perfil.id)

      setExito('✅ Foto actualizada correctamente.')
      setTimeout(() => setExito(''), 3000)
    } catch (err) {
      setError('Error al subir foto: ' + err.message)
    } finally {
      setSubiendoFoto(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar rol={perfil?.rol || 'publico'} />

      {/* Contenido: con margen solo si sidebar es fijo */}
      <div className={`flex-1 flex flex-col min-h-screen ${tieneSidebarFijo ? 'ml-64' : ''}`}>

        {/* Header */}
        <nav className="bg-white shadow-sm sticky top-0 z-40">
          <div className="px-8 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2 ml-10">
              <span className="text-2xl">🦷</span>
              <span className="text-xl font-bold text-teal-700">DentaNovax</span>
            </div>
            <div className="flex items-center gap-3">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar"
                  className="w-9 h-9 rounded-full object-cover border-2 border-teal-500" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
                  {perfil?.nombre?.charAt(0)}{perfil?.apellido?.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-800">¡Hola, {perfil?.nombre}! 👋</p>
                <p className="text-xs text-gray-400">
                  {new Date().toLocaleDateString('es-PE', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </p>
              </div>
              <button
                onClick={cerrarSesion}
                className="border border-red-400 text-red-500 hover:bg-red-50 hover:border-red-500 text-xs font-medium px-3 py-1.5 rounded-lg transition"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </nav>

        {/* Contenido */}
        <div className="flex-1 px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">⚙️ Editar perfil</h1>
            <p className="text-gray-500 text-sm mt-1">Actualiza tu información personal y preferencias de cuenta</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Foto */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
                <h2 className="font-semibold text-gray-800 mb-4">Foto de perfil</h2>
                <div className="relative inline-block mb-4">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-4 border-teal-500 mx-auto" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-3xl mx-auto">
                      {perfil?.nombre?.charAt(0)}{perfil?.apellido?.charAt(0)}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-3">{perfil?.nombre} {perfil?.apellido}</p>
                <span className="inline-block bg-teal-100 text-teal-700 text-xs font-semibold px-3 py-1 rounded-full capitalize mb-4">
                  {perfil?.rol}
                </span>
                <button
                  onClick={() => inputFoto.current?.click()}
                  disabled={subiendoFoto}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 rounded-xl transition disabled:opacity-50 text-sm"
                >
                  {subiendoFoto ? 'Subiendo...' : '📷 Cambiar foto'}
                </button>
                <input type="file" ref={inputFoto} onChange={handleSubirFoto} accept="image/*" className="hidden" />
                <p className="text-xs text-gray-400 mt-2">JPG, PNG o GIF. Máx 2MB.</p>
              </div>
            </div>

            {/* Formularios */}
            <div className="md:col-span-2 space-y-6">

              {/* Datos personales */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="font-semibold text-gray-800 mb-4">Datos personales</h2>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm mb-4">{error}</div>
                )}
                {exito && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm mb-4">{exito}</div>
                )}
                <form onSubmit={handleGuardarPerfil} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                      <input type="text" name="apellido" value={form.apellido} onChange={handleChange} required
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input type="text" name="telefono" value={form.telefono} onChange={handleChange}
                      placeholder="9 dígitos" inputMode="numeric" maxLength={9}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                    <input type="text" value={perfil?.rol} disabled
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-100 text-gray-400 capitalize" />
                  </div>
                  <button type="submit" disabled={guardando}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-50">
                    {guardando ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </form>
              </div>

              {/* Cambiar contraseña */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="font-semibold text-gray-800 mb-4">🔐 Cambiar contraseña</h2>
                {errorPass && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm mb-4">{errorPass}</div>
                )}
                {exitoPass && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm mb-4">{exitoPass}</div>
                )}
                <form onSubmit={handleCambiarPassword} className="space-y-4">
                  {/* Contraseña actual */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña actual <span className="text-red-500">*</span>
                    </label>
                    <input type="password" name="actual" value={passwordForm.actual}
                      onChange={handleChangePass} required placeholder="Ingresa tu contraseña actual"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50" />
                  </div>
                  {/* Nueva contraseña */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
                    <input type="password" name="nueva" value={passwordForm.nueva}
                      onChange={handleChangePass} required placeholder="Mínimo 8 caracteres"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50" />
                    {passwordForm.nueva && (
                      <div className="mt-2 space-y-1">
                        {[
                          [passwordForm.nueva.length >= 8, 'Mínimo 8 caracteres'],
                          [/[A-Z]/.test(passwordForm.nueva), 'Al menos una mayúscula'],
                          [/\d.*\d/.test(passwordForm.nueva), 'Al menos 2 números'],
                          [/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordForm.nueva), 'Al menos un carácter especial'],
                        ].map(([ok, label]) => (
                          <p key={label} className={`text-xs flex items-center gap-1 ${ok ? 'text-green-600' : 'text-red-500'}`}>
                            {ok ? '✅' : '❌'} {label}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Confirmar contraseña */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                    <input type="password" name="confirmar" value={passwordForm.confirmar}
                      onChange={handleChangePass} required placeholder="Repite la contraseña"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50" />
                    {passwordForm.confirmar && (
                      <p className={`text-xs mt-1 ${passwordForm.nueva === passwordForm.confirmar ? 'text-green-600' : 'text-red-500'}`}>
                        {passwordForm.nueva === passwordForm.confirmar ? '✅ Las contraseñas coinciden' : '❌ No coinciden'}
                      </p>
                    )}
                  </div>
                  <button type="submit" disabled={guardandoPass}
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-50">
                    {guardandoPass ? 'Actualizando...' : 'Cambiar contraseña'}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
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