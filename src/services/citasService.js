// src/services/citasService.js
import { supabase } from '../lib/supabase'

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

export async function verificarDisponibilidad(odontologoId, fecha, hora, citaIdExcluir = null) {
  let query = supabase
    .from('citas')
    .select('id')
    .eq('odontologo_id', odontologoId)
    .eq('fecha', fecha)
    .eq('hora', hora)
    .neq('estado', 'cancelada')

  if (citaIdExcluir) {
    query = query.neq('id', citaIdExcluir)
  }

  const { data, error } = await query
  return { disponible: data?.length === 0, error }
}

// NUEVA: obtener odontólogos disponibles en una fecha y hora específica
export async function obtenerOdontologosDisponibles(fecha, hora) {
  // 1. Obtener todos los odontólogos
  const { data: todos, error: errorTodos } = await supabase
    .from('perfiles')
    .select('id, nombre, apellido')
    .eq('rol', 'odontologo')

  if (errorTodos || !todos) return { data: [], error: errorTodos }

  // 2. Obtener los que ya tienen cita en esa fecha y hora
  const { data: ocupados, error: errorOcupados } = await supabase
    .from('citas')
    .select('odontologo_id')
    .eq('fecha', fecha)
    .eq('hora', hora + ':00')
    .neq('estado', 'cancelada')

  if (errorOcupados) return { data: [], error: errorOcupados }

  // 3. Filtrar — quedarse solo con los que NO están ocupados
  const idsOcupados = (ocupados || []).map(c => c.odontologo_id)
  const disponibles = todos.filter(d => !idsOcupados.includes(d.id))

  return { data: disponibles, error: null }
}

export async function crearCita(cita) {
  const { data, error } = await supabase
    .from('citas')
    .insert(cita)
    .select()
    .single()
  return { data, error }
}

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

export async function reprogramarCita(id, fecha, hora) {
  const { data, error } = await supabase
    .from('citas')
    .update({ fecha, hora, estado: 'programada' })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function obtenerOdontologos() {
  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombre, apellido')
    .eq('rol', 'odontologo')
  return { data, error }
}