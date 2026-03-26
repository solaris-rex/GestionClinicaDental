// src/services/pacientesService.js
// Contiene todas las operaciones de la tabla 'pacientes' en Supabase.
// Los componentes importan estas funciones en lugar de llamar a Supabase directamente.

import { supabase } from '../lib/supabase'

// Obtener todos los pacientes ordenados por apellido
export async function obtenerPacientes() {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .order('apellido', { ascending: true })
  return { data, error }
}

// Buscar pacientes por nombre, apellido o DNI
export async function buscarPacientes(termino) {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .or(`nombre.ilike.%${termino}%,apellido.ilike.%${termino}%,dni.ilike.%${termino}%`)
    .order('apellido', { ascending: true })
  return { data, error }
}

// Registrar un nuevo paciente
export async function crearPaciente(paciente) {
  const { data, error } = await supabase
    .from('pacientes')
    .insert(paciente)
    .select()
    .single()
  return { data, error }
}

// Actualizar datos de un paciente existente
export async function actualizarPaciente(id, cambios) {
  const { data, error } = await supabase
    .from('pacientes')
    .update(cambios)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

// Obtener un paciente por su ID
export async function obtenerPacientePorId(id) {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .eq('id', id)
    .single()
  return { data, error }
}