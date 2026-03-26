// src/services/citasService.js
// Contiene todas las operaciones de la tabla 'citas' en Supabase.

import { supabase } from '../lib/supabase'

// Obtener todas las citas con datos del paciente y odontólogo
export async function obtenerCitas() {
  const { data, error } = await supabase
    .from('citas')
    .select(`
      *,
      paciente:pacientes(id, nombre, apellido, dni),
      odontologo:perfiles(id, nombre, apellido)
    `)
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true })
  return { data, error }
}

// Obtener citas de un odontólogo específico
export async function obtenerCitasPorOdontologo(odontologoId) {
  const { data, error } = await supabase
    .from('citas')
    .select(`
      *,
      paciente:pacientes(id, nombre, apellido, dni),
      odontologo:perfiles(id, nombre, apellido)
    `)
    .eq('odontologo_id', odontologoId)
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true })
  return { data, error }
}

// Verificar si ya existe una cita en esa fecha y hora para ese odontólogo
export async function verificarDisponibilidad(odontologoId, fecha, hora, citaIdExcluir = null) {
  let query = supabase
    .from('citas')
    .select('id')
    .eq('odontologo_id', odontologoId)
    .eq('fecha', fecha)
    .eq('hora', hora)
    .neq('estado', 'cancelada') // las canceladas no bloquean el horario

  if (citaIdExcluir) {
    query = query.neq('id', citaIdExcluir)
  }

  const { data, error } = await query
  return { disponible: data?.length === 0, error }
}

// Crear una nueva cita
export async function crearCita(cita) {
  const { data, error } = await supabase
    .from('citas')
    .insert(cita)
    .select()
    .single()
  return { data, error }
}

// Actualizar estado de una cita
export async function actualizarEstadoCita(id, estado, notas = null) {
  const cambios = { estado }
  if (notas !== null) cambios.notas = notas

  const { data, error } = await supabase
    .from('citas')
    .update(cambios)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

// Reprogramar una cita (cambiar fecha y hora)
export async function reprogramarCita(id, fecha, hora) {
  const { data, error } = await supabase
    .from('citas')
    .update({ fecha, hora, estado: 'programada' })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

// Obtener odontólogos disponibles (para el selector del formulario)
export async function obtenerOdontologos() {
  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombre, apellido')
    .eq('rol', 'odontologo')
  return { data, error }
}