// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const cargandoPerfil = useRef(false) // evita cargas duplicadas

  useEffect(() => {
    let montado = true

    async function inicializar() {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!montado) return

        if (session?.user) {
          setUsuario(session.user)
          await cargarPerfil(session.user.id, montado)
        } else {
          setUsuario(null)
          setPerfil(null)
          setCargando(false)
        }
      } catch (err) {
        if (montado) setCargando(false)
      }
    }

    inicializar()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!montado) return

        if (session?.user) {
          setUsuario(session.user)
          await cargarPerfil(session.user.id, montado)
        } else {
          setUsuario(null)
          setPerfil(null)
          setCargando(false)
        }
      }
    )

    return () => {
      montado = false
      subscription.unsubscribe()
    }
  }, [])

  async function cargarPerfil(userId, montado = true) {
    // Evitar cargas duplicadas simultáneas
    if (cargandoPerfil.current) return
    cargandoPerfil.current = true

    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (montado) {
        if (!error && data) setPerfil(data)
        setCargando(false)
      }
    } catch (err) {
      if (montado) setCargando(false)
    } finally {
      cargandoPerfil.current = false
    }
  }

  async function cerrarSesion() {
    setCargando(true)
    try {
      await supabase.auth.signOut()
    } finally {
      setUsuario(null)
      setPerfil(null)
      setCargando(false)
      window.location.href = '/login'
    }
  }

  const valor = { usuario, perfil, cargando, cerrarSesion }

  return (
    <AuthContext.Provider value={valor}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}