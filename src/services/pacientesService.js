// src/services/pacientesService.js
import { supabase } from '../lib/supabase'

export async function obtenerPacientes() {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .order('apellido', { ascending: true })
  return { data, error }
}

export async function buscarPacientes(termino) {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .or(`nombre.ilike.%${termino}%,apellido.ilike.%${termino}%,dni.ilike.%${termino}%`)
    .order('apellido', { ascending: true })
  return { data, error }
}

/**
 * Versión de depuración para identificar bloqueos en la inserción
 */
export async function crearPaciente(paciente) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT_SUPABASE')), 8000)
  )

  const supabasePromise = supabase
    .from('pacientes')
    .insert(paciente)
    .select()

  try {
    const { data, error } = await Promise.race([supabasePromise, timeoutPromise])
    if (error) return { data: null, error }
    return { data: data?.[0] || null, error: null }
  } catch (err) {
    if (err.message === 'TIMEOUT_SUPABASE') {
      return { data: null, error: { message: 'La operación tardó demasiado. ¿El DNI ya existe?', code: 'TIMEOUT' } }
    }
    return { data: null, error: { message: err.message } }
  }
}

export async function actualizarPaciente(id, cambios) {
  const { data, error } = await supabase
    .from('pacientes')
    .update(cambios)
    .eq('id', id)
    .select()
  if (error) return { data: null, error }
  return { data: data?.[0] || null, error: null }
}

export async function obtenerPacientePorId(id) {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return { data, error }
}

export async function obtenerPacientePorEmail(email) {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .eq('email', email)
    .maybeSingle()
  return { data, error }
}