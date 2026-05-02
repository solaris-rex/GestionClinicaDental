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

  useEffect(() => {
    let montado = true

    async function inicializar() {
      try {
        const timeoutId = setTimeout(() => {
          if (montado) {
            limpiarTokenSucio()
            setUsuario(null)
            setPerfil(null)
            setCargando(false)
            window.location.href = '/login'
          }
        }, 8000)

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        clearTimeout(timeoutId)

        if (!montado) return

        if (error) {
          limpiarTokenSucio()
          setUsuario(null)
          setPerfil(null)
          setCargando(false)
          return
        }

        if (session?.user) {
          setUsuario(session.user)
          await cargarPerfil(session.user.id, montado)
        } else {
          setUsuario(null)
          setPerfil(null)
          setCargando(false)
        }
      } catch (err) {
        limpiarTokenSucio()

        if (montado) {
          setUsuario(null)
          setPerfil(null)
          setCargando(false)
        }
      }
    }

    inicializar()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!montado) return

      if (event === 'TOKEN_REFRESHED' && !session) {
        limpiarTokenSucio()
        setUsuario(null)
        setPerfil(null)
        setCargando(false)
        window.location.href = '/login'
        return
      }

      if (session?.user) {
        setUsuario(session.user)
        await cargarPerfil(session.user.id, montado)
      } else {
        setUsuario(null)
        setPerfil(null)
        setCargando(false)
      }
    })

    return () => {
      montado = false
      subscription.unsubscribe()
    }
  }, [])

  async function cargarPerfil(userId, montado = true, intentos = 0) {
    if (cargandoPerfil.current) return
    cargandoPerfil.current = true

    try {
      // maybeSingle evita error 406
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (!montado) return

      if (data) {
        // Perfil encontrado
        setPerfil(data)
        setCargando(false)
      } else if (intentos < 3) {
        // Reintentar si el perfil aún no aparece
        cargandoPerfil.current = false

        setTimeout(() => {
          cargarPerfil(userId, montado, intentos + 1)
        }, 1000)
      } else {
        // Si después de 3 intentos no existe perfil
        limpiarTokenSucio()
        setUsuario(null)
        setPerfil(null)
        setCargando(false)
        window.location.href = '/login'
      }
    } catch (err) {
      limpiarTokenSucio()

      if (montado) {
        setUsuario(null)
        setPerfil(null)
        setCargando(false)
        window.location.href = '/login'
      }
    } finally {
      cargandoPerfil.current = false
    }
  }

  async function cerrarSesion() {
    // Limpiar inmediatamente
    limpiarTokenSucio()
    setUsuario(null)
    setPerfil(null)
    setCargando(false)

    // Redirigir de inmediato
    window.location.href = '/login'

    // Cerrar sesión en segundo plano (no bloqueante)
    supabase.auth.signOut().catch(() => {})
  }

  const valor = {
    usuario,
    perfil,
    cargando,
    cerrarSesion,
  }

  return (
    <AuthContext.Provider value={valor}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}