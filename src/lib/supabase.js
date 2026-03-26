// src/lib/supabase.js
// Este archivo crea la conexión con Supabase
// Lo importaremos en todos los servicios que necesiten la base de datos

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)