// src/pages/admin/PanelAdmin.jsx
// Panel principal del administrador.
// Permite ver y gestionar todos los usuarios del sistema.

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/layout/Navbar'

export default function PanelAdmin() {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarUsuarios()
  }, [])

  async function cargarUsuarios() {
    setCargando(true)
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) setError('Error al cargar usuarios')
    else setUsuarios(data)
    setCargando(false)
  }

  async function cambiarRol(id, nuevoRol) {
    const { error } = await supabase
      .from('perfiles')
      .update({ rol: nuevoRol })
      .eq('id', id)

    if (error) alert('Error al cambiar rol')
    else cargarUsuarios() // recargar la lista
  }

  const coloresPorRol = {
    administrador: 'bg-purple-100 text-purple-700',
    recepcionista: 'bg-green-100 text-green-700',
    odontologo: 'bg-blue-100 text-blue-700',
    paciente: 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          👥 Gestión de Usuarios
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        {cargando ? (
          <p className="text-gray-500">Cargando usuarios...</p>
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 text-gray-600">Teléfono</th>
                  <th className="text-left px-4 py-3 text-gray-600">Rol actual</th>
                  <th className="text-left px-4 py-3 text-gray-600">Cambiar rol</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {u.nombre} {u.apellido}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {u.telefono || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${coloresPorRol[u.rol]}`}>
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.rol}
                        onChange={(e) => cambiarRol(u.id, e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      >
                        <option value="administrador">Administrador</option>
                        <option value="recepcionista">Recepcionista</option>
                        <option value="odontologo">Odontólogo</option>
                        <option value="paciente">Paciente</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {usuarios.length === 0 && (
              <p className="text-center text-gray-400 py-8">
                No hay usuarios registrados
              </p>
            )}
          </div>
        )}

        {/* Resumen por roles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {['administrador', 'recepcionista', 'odontologo', 'paciente'].map((rol) => (
            <div key={rol} className="bg-white rounded-xl shadow p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">
                {usuarios.filter((u) => u.rol === rol).length}
              </p>
              <p className="text-sm text-gray-500 capitalize">{rol}s</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}