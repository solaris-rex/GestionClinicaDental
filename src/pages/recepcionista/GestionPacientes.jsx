// src/pages/recepcionista/GestionPacientes.jsx
// Página principal de gestión de pacientes.
// Permite listar, buscar, registrar y editar pacientes.

import { useEffect, useState } from 'react'
import Navbar from '../../components/layout/Navbar'
import FormularioPaciente from '../../components/pacientes/FormularioPaciente'
import {
  obtenerPacientes,
  buscarPacientes,
  crearPaciente,
  actualizarPaciente,
} from '../../services/pacientesService'

export default function GestionPacientes() {
  const [pacientes, setPacientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [vista, setVista] = useState('lista') // 'lista' | 'nuevo' | 'editar'
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null)

  useEffect(() => {
    cargarPacientes()
  }, [])

  async function cargarPacientes() {
    setCargando(true)
    const { data } = await obtenerPacientes()
    setPacientes(data || [])
    setCargando(false)
  }

  async function handleBusqueda(e) {
    const termino = e.target.value
    setBusqueda(termino)
    if (termino.trim() === '') {
      cargarPacientes()
    } else {
      const { data } = await buscarPacientes(termino)
      setPacientes(data || [])
    }
  }

  async function handleGuardarNuevo(form) {
    const resultado = await crearPaciente(form)
    if (!resultado.error) {
      await cargarPacientes()
      setVista('lista')
    }
    return resultado
  }

  async function handleGuardarEdicion(form) {
    const resultado = await actualizarPaciente(pacienteSeleccionado.id, form)
    if (!resultado.error) {
      await cargarPacientes()
      setVista('lista')
    }
    return resultado
  }

  function handleEditar(paciente) {
    setPacienteSeleccionado(paciente)
    setVista('editar')
  }

  // Calcular edad desde fecha de nacimiento
  function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return '—'
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    return hoy.getFullYear() - nacimiento.getFullYear()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Encabezado */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            🏥 Gestión de Pacientes
          </h2>
          {vista === 'lista' && (
            <button
              onClick={() => setVista('nuevo')}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              + Nuevo paciente
            </button>
          )}
        </div>

        {/* Vista: Formulario nuevo paciente */}
        {vista === 'nuevo' && (
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Registrar nuevo paciente
            </h3>
            <FormularioPaciente
              onGuardar={handleGuardarNuevo}
              onCancelar={() => setVista('lista')}
            />
          </div>
        )}

        {/* Vista: Formulario editar paciente */}
        {vista === 'editar' && pacienteSeleccionado && (
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Editar paciente: {pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido}
            </h3>
            <FormularioPaciente
              pacienteInicial={pacienteSeleccionado}
              onGuardar={handleGuardarEdicion}
              onCancelar={() => setVista('lista')}
            />
          </div>
        )}

        {/* Vista: Lista de pacientes */}
        {vista === 'lista' && (
          <>
            {/* Buscador */}
            <div className="mb-4">
              <input
                type="text"
                value={busqueda}
                onChange={handleBusqueda}
                placeholder="🔍 Buscar por nombre, apellido o DNI..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
              />
            </div>

            {/* Tabla de pacientes */}
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              {cargando ? (
                <p className="text-center text-gray-400 py-8">Cargando pacientes...</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 text-gray-600">Paciente</th>
                      <th className="text-left px-4 py-3 text-gray-600">DNI</th>
                      <th className="text-left px-4 py-3 text-gray-600">Teléfono</th>
                      <th className="text-left px-4 py-3 text-gray-600">Edad</th>
                      <th className="text-left px-4 py-3 text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pacientes.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">
                            {p.nombre} {p.apellido}
                          </p>
                          <p className="text-xs text-gray-400">{p.email || '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{p.dni}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {p.telefono || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {calcularEdad(p.fecha_nacimiento)} años
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleEditar(p)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium px-3 py-1 rounded-lg transition"
                          >
                            ✏️ Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {!cargando && pacientes.length === 0 && (
                <p className="text-center text-gray-400 py-8">
                  No se encontraron pacientes
                </p>
              )}
            </div>

            {/* Contador */}
            <p className="text-sm text-gray-400 mt-3">
              Total: {pacientes.length} paciente(s)
            </p>
          </>
        )}
      </div>
    </div>
  )
}