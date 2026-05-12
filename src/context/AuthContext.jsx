// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

function limpiarTokenSucio() {
  Object.keys(localStorage).forEach((key) => {
    if (key.includes('supabase') || key.includes('sb-')) {
      localStorage.removeItem(key)
    }
  })
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const cargandoPerfil = useRef(false)
  const inicializado = useRef(false)

  useEffect(() => {
    let montado = true

    const timeoutSeguridad = setTimeout(() => {
      if (montado) setCargando(false)
    }, 5000)

    async function inicializar() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        clearTimeout(timeoutSeguridad)
        if (!montado) return

        if (error || !session?.user) {
          if (error) limpiarTokenSucio()
          setUsuario(null)
          setPerfil(null)
          setCargando(false)
          inicializado.current = true
          return
        }

        setUsuario(session.user)
        await cargarPerfil(session.user.id, montado)
        inicializado.current = true
      } catch {
        clearTimeout(timeoutSeguridad)
        if (montado) {
          setUsuario(null)
          setPerfil(null)
          setCargando(false)
          inicializado.current = true
        }
      }
    }

    inicializar()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!montado) return

        // Ignorar eventos hasta que la inicialización termine
        if (!inicializado.current) return

        if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
          limpiarTokenSucio()
          setUsuario(null)
          setPerfil(null)
          setCargando(false)
          return
        }

        if (event === 'SIGNED_IN' && session?.user) {
          setUsuario(session.user)
          await cargarPerfil(session.user.id, montado)
          return
        }

        if (!session?.user) {
          setUsuario(null)
          setPerfil(null)
          setCargando(false)
        }
      }
    )

    return () => {
      montado = false
      clearTimeout(timeoutSeguridad)
      subscription.unsubscribe()
    }
  }, [])

  async function cargarPerfil(userId, montado = true, intentos = 0) {
    if (cargandoPerfil.current) return
    cargandoPerfil.current = true

    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (!montado) return

      if (data) {
        setPerfil(data)
        setCargando(false)
      } else if (intentos < 3) {
        cargandoPerfil.current = false
        setTimeout(() => cargarPerfil(userId, montado, intentos + 1), 1000)
      } else {
        setUsuario(null)
        setPerfil(null)
        setCargando(false)
      }
    } catch {
      if (montado) {
        setPerfil(null)
        setCargando(false)
      }
    } finally {
      cargandoPerfil.current = false
    }
  }

  async function cerrarSesion() {
    limpiarTokenSucio()
    setUsuario(null)
    setPerfil(null)
    setCargando(false)
    window.location.href = '/login'
    supabase.auth.signOut().catch(() => {})
  }

  return (
    <AuthContext.Provider value={{ usuario, perfil, cargando, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}