// src/pages/paciente/PanelPaciente.jsx
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/layout/Sidebar'
import { obtenerOdontologosDisponibles, crearCita } from '../../services/citasService'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

const COLORES_ESTADO = {
  programada: 'bg-blue-100 text-blue-700',
  confirmada: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
  completada: 'bg-gray-100 text-gray-600',
}

const HORAS_DISPONIBLES = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
]

const FORM_VACIO = { fecha: '', hora: '', odontologo_id: '', motivo: '' }

function ContadorReembolso({ fechaPago }) {
  const [tiempoRestante, setTiempoRestante] = useState('')
  const [vencido, setVencido] = useState(false)

  useEffect(() => {
    function calcular() {
      const limite = new Date(new Date(fechaPago).getTime() + 24 * 60 * 60 * 1000)
      const diff = limite - new Date()
      if (diff <= 0) { setVencido(true); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTiempoRestante(`${h}h ${m}m ${s}s`)
    }
    calcular()
    const id = setInterval(calcular, 1000)
    return () => clearInterval(id)
  }, [fechaPago])

  if (vencido) return <p className="text-xs text-red-500 mt-1 font-medium">❌ Período de reembolso vencido</p>
  return <p className="text-xs text-amber-600 mt-1 font-medium">⏱ Cancelar con reembolso: {tiempoRestante} restantes</p>
}

function FormularioPago({ clientSecret, onPagoExitoso, onCancelar }) {
  const stripe = useStripe()
  const elements = useElements()
  const [errorPago, setErrorPago] = useState('')
  const [procesando, setProcesando] = useState(false)

  async function handlePagar(e) {
    e.preventDefault()
    if (!stripe || !elements) return
    setProcesando(true)
    setErrorPago('')
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) },
    })
    if (error) { setErrorPago(error.message); setProcesando(false); return }
    if (paymentIntent.status === 'succeeded') onPagoExitoso(paymentIntent.id)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <p className="text-4xl mb-2">💳</p>
          <h3 className="text-xl font-bold text-gray-800">Pago de reserva</h3>
          <p className="text-gray-500 text-sm mt-1">Se cobrará <span className="font-bold text-teal-700">S/ 20.00</span> para confirmar tu cita</p>
        </div>
        {errorPago && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{errorPago}</div>}
        <form onSubmit={handlePagar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Datos de tarjeta</label>
            <div className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
              <CardElement options={{ style: { base: { fontSize: '16px', color: '#374151', '::placeholder': { color: '#9CA3AF' } }, invalid: { color: '#EF4444' } }, hidePostalCode: true, disableLink: true }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">🔒 Pago seguro con Stripe.</p>
          </div>
          <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-sm text-teal-700">
            <p className="font-semibold mb-1">💡 Política de reembolso</p>
            <p>Si cancelas dentro de las <strong>24 horas</strong> siguientes al pago, recibirás el reembolso completo de S/ 20.00.</p>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={!stripe || procesando}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50">
              {procesando ? 'Procesando...' : 'Pagar S/ 20.00'}
            </button>
            <button type="button" onClick={onCancelar} disabled={procesando}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition disabled:opacity-50">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalCancelacion({ cita, onConfirmar, onCerrar, cancelando }) {
  const dentroDeplazo = cita.fecha_pago ? (new Date() - new Date(cita.fecha_pago)) < 86400000 : false
  const tieneReembolso = cita.pagado && !cita.reembolsado && dentroDeplazo

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <p className="text-4xl mb-2">{tieneReembolso ? '💰' : '⚠️'}</p>
          <h3 className="text-xl font-bold text-gray-800">{tieneReembolso ? 'Cancelar con reembolso' : 'Cancelar cita'}</h3>
        </div>
        {tieneReembolso ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 text-sm">
            ✅ Estás dentro del plazo de 24 horas. Recibirás un reembolso de <strong>S/ 20.00</strong> a tu tarjeta.
          </div>
        ) : cita.pagado && !cita.reembolsado ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            ❌ Han pasado más de 24 horas. Al cancelar <strong>no se te reembolsará</strong> el adelanto de S/ 20.00.
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-xl mb-6 text-sm">
            ¿Estás seguro de que deseas cancelar esta cita?
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onConfirmar} disabled={cancelando}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50">
            {cancelando ? 'Cancelando...' : 'Sí, cancelar'}
          </button>
          <button onClick={onCerrar} disabled={cancelando}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition">
            Volver
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PanelPaciente() {
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [citas, setCitas] = useState([])
  const [pacienteId, setPacienteId] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [vista, setVista] = useState('lista')

  const [form, setForm] = useState(FORM_VACIO)
  const [odontologosDisponibles, setOdontologosDisponibles] = useState([])
  const [buscandoOdontologos, setBuscandoOdontologos] = useState(false)
  const [sinOdontologos, setSinOdontologos] = useState(false)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [exitoCita, setExitoCita] = useState(false)

  const [clientSecret, setClientSecret] = useState(null)
  const [mostrarPago, setMostrarPago] = useState(false)
  const [citaACancelar, setCitaACancelar] = useState(null)
  const [cancelando, setCancelando] = useState(false)

  useEffect(() => {
    const vistaParam = searchParams.get('vista')
    const nuevaVista = vistaParam === 'nueva' ? 'nueva' : 'lista'
    setVista(nuevaVista)
    // Limpiar form al cambiar a vista nueva
    if (nuevaVista === 'nueva') {
      setForm(FORM_VACIO)
      setOdontologosDisponibles([])
      setSinOdontologos(false)
      setError('')
    }
  }, [searchParams])

  useEffect(() => {
    if (perfil?.id) cargarDatos()
  }, [perfil])

  async function cargarDatos() {
    setCargando(true)
    const { data: authData } = await supabase.auth.getUser()
    const emailUsuario = authData?.user?.email
    if (!emailUsuario) { setCargando(false); return }

    const { data: perfilData } = await supabase.from('perfiles').select('*').eq('id', authData.user.id).maybeSingle()
    let pacienteData = null

    if (perfilData?.dni) {
      const { data } = await supabase.from('pacientes').select('id').eq('dni', perfilData.dni).maybeSingle()
      pacienteData = data
    }
    if (!pacienteData) {
      const { data } = await supabase.from('pacientes').select('id').eq('email', emailUsuario).maybeSingle()
      pacienteData = data
    }
    if (!pacienteData && perfilData) {
      const { data: nuevo } = await supabase.from('pacientes').insert({
        nombre: perfilData.nombre, apellido: perfilData.apellido,
        dni: perfilData.dni || `AUTO-${authData.user.id.slice(0, 8)}`,
        telefono: perfilData.telefono || null, email: emailUsuario,
      }).select('id').maybeSingle()
      pacienteData = nuevo
    }

    if (pacienteData) {
      setPacienteId(pacienteData.id)
      await cargarCitas(pacienteData.id)
    }
    setCargando(false)
  }

  async function cargarCitas(pId) {
    const { data } = await supabase.from('citas')
      .select('*, odontologo:perfiles(nombre, apellido)')
      .eq('paciente_id', pId).order('fecha', { ascending: true })
    setCitas(data || [])
  }

  async function buscarOdontologosDisponibles(fecha, hora) {
    setBuscandoOdontologos(true)
    setSinOdontologos(false)
    setOdontologosDisponibles([])
    try {
      const { data } = await obtenerOdontologosDisponibles(fecha, hora)
      const lista = data || []
      setOdontologosDisponibles(lista)
      setSinOdontologos(lista.length === 0)
    } catch { setSinOdontologos(true) }
    finally { setBuscandoOdontologos(false) }
  }

  function handleChange(e) {
    const { name, value } = e.target
    if (name === 'fecha' || name === 'hora') {
      const nuevaFecha = name === 'fecha' ? value : form.fecha
      const nuevaHora = name === 'hora' ? value : form.hora
      setForm(prev => ({ ...prev, [name]: value, odontologo_id: '' }))
      setOdontologosDisponibles([])
      setSinOdontologos(false)
      if (nuevaFecha && nuevaHora) buscarOdontologosDisponibles(nuevaFecha, nuevaHora)
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  async function handleIniciarPago(e) {
    e.preventDefault()
    setError('')
    if (!pacienteId) { setError('Tu cuenta no está vinculada. Comunícate con recepción.'); return }
    if (!form.fecha || !form.hora || !form.odontologo_id) { setError('Completa todos los campos requeridos.'); return }

    setGuardando(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ monto: 2000, descripcion: `Reserva cita dental — ${form.fecha} ${form.hora}`, metadata: { paciente_id: pacienteId, odontologo_id: form.odontologo_id, fecha: form.fecha, hora: form.hora } }),
      })

      const data = await res.json()
      if (!res.ok || data.error) { setError('Error al iniciar el pago: ' + (data.error || 'intenta de nuevo')); setGuardando(false); return }

      setClientSecret(data.client_secret)
      setGuardando(false)
      setMostrarPago(true)
    } catch (err) {
      setError('Error inesperado: ' + err.message)
      setGuardando(false)
    }
  }

  async function handlePagoExitoso(intentId) {
    setMostrarPago(false)
    setGuardando(true)
    try {
      const { error: citaError } = await crearCita({
        paciente_id: pacienteId, odontologo_id: form.odontologo_id,
        fecha: form.fecha, hora: form.hora + ':00', motivo: form.motivo,
        estado: 'programada', payment_intent_id: intentId,
        pagado: true, fecha_pago: new Date().toISOString(), monto_pagado: 2000,
      })
      if (citaError) { setError('Pago realizado pero error al crear la cita. Contacta a recepción.'); setGuardando(false); return }
      await cargarCitas(pacienteId)
      setForm(FORM_VACIO)
      setOdontologosDisponibles([])
      setSinOdontologos(false)
      setClientSecret(null)
      setExitoCita(true)
      navigate('/paciente?vista=lista')
      setTimeout(() => setExitoCita(false), 5000)
    } catch { setError('Error inesperado. Contacta a recepción.') }
    finally { setGuardando(false) }
  }

  function handleCancelarPago() { setMostrarPago(false); setClientSecret(null) }

  async function handleConfirmarCancelacion() {
    if (!citaACancelar) return
    setCancelando(true)
    try {
      if (citaACancelar.pagado && !citaACancelar.reembolsado && citaACancelar.payment_intent_id) {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData?.session?.access_token
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        try {
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/refund-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
            body: JSON.stringify({ payment_intent_id: citaACancelar.payment_intent_id, fecha_pago: citaACancelar.fecha_pago }),
            signal: controller.signal,
          })
          clearTimeout(timeoutId)
          const refundData = await res.json()
          await supabase.from('citas').update({ estado: 'cancelada', reembolsado: refundData.reembolsado === true }).eq('id', citaACancelar.id)
        } catch {
          clearTimeout(timeoutId)
          await supabase.from('citas').update({ estado: 'cancelada' }).eq('id', citaACancelar.id)
        }
      } else {
        await supabase.from('citas').update({ estado: 'cancelada' }).eq('id', citaACancelar.id)
      }
      await cargarCitas(pacienteId)
      setCitaACancelar(null)
    } catch { setCitaACancelar(null) }
    finally { setCancelando(false) }
  }

  function formatearFecha(fecha) {
    if (!fecha) return '—'
    const [, mes, dia] = fecha.split('-')
    return `${dia}/${mes}`
  }

  function obtenerDiaSemana(fecha) {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    return dias[new Date(fecha + 'T00:00:00').getDay()]
  }

  const hoy = new Date().toISOString().split('T')[0]
  const citasPendientes = citas.filter(c => c.fecha >= hoy && c.estado !== 'cancelada')
  const citasPasadas = citas.filter(c => c.fecha < hoy || c.estado === 'completada')
  const puedeGuardar = !!(form.fecha && form.hora && form.odontologo_id)

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar rol="paciente" />

      {mostrarPago && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <FormularioPago clientSecret={clientSecret} onPagoExitoso={handlePagoExitoso} onCancelar={handleCancelarPago} />
        </Elements>
      )}

      {citaACancelar && (
        <ModalCancelacion cita={citaACancelar} onConfirmar={handleConfirmarCancelacion} onCerrar={() => setCitaACancelar(null)} cancelando={cancelando} />
      )}

      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="w-full px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 ml-10">
            <span className="text-2xl">🦷</span>
            <span className="text-xl font-bold text-teal-700">DentaNovax</span>
          </div>
          <div className="flex items-center gap-3">
            {perfil?.avatar_url ? (
              <img src={perfil.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full object-cover border-2 border-teal-500" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
                {perfil?.nombre?.charAt(0)}{perfil?.apellido?.charAt(0)}
              </div>
            )}
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">¡Hola, {perfil?.nombre}! 👋</p>
              <p className="text-xs text-gray-400">{new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-1">👋 Hola, {perfil?.nombre}</h1>
          <p className="text-teal-100">Bienvenido a tu panel de citas — {new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {exitoCita && (
          <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            ✅ ¡Cita reservada y pago confirmado! Tienes 24h para cancelar con reembolso.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center border-t-4 border-teal-500">
            <p className="text-4xl font-bold text-teal-600">{citasPendientes.length}</p>
            <p className="text-gray-500 mt-1 text-sm">Citas pendientes</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center border-t-4 border-gray-300">
            <p className="text-4xl font-bold text-gray-600">{citasPasadas.length}</p>
            <p className="text-gray-500 mt-1 text-sm">Citas anteriores</p>
          </div>
          <div className="bg-teal-600 rounded-2xl shadow-sm p-6 text-center cursor-pointer hover:bg-teal-700 transition"
            onClick={() => navigate('/paciente?vista=nueva')}>
            <p className="text-4xl mb-1">📅</p>
            <p className="text-white font-semibold">+ Solicitar nueva cita</p>
          </div>
        </div>

        {vista === 'nueva' && (
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">📅 Solicitar nueva cita</h2>
              <button onClick={() => navigate('/paciente?vista=lista')} className="text-gray-400 hover:text-gray-600 text-sm">✕ Cancelar</button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
            {!pacienteId && !cargando && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl mb-4 text-sm">
                ⚠️ Tu cuenta no está completamente vinculada. Recarga la página.
              </div>
            )}

            <form onSubmit={handleIniciarPago} className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Paso 1 — Elige fecha y hora</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha <span className="text-red-500">*</span></label>
                    <input type="date" name="fecha" value={form.fecha} onChange={handleChange} required min={hoy}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hora <span className="text-red-500">*</span></label>
                    <select name="hora" value={form.hora} onChange={handleChange} required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50">
                      <option value="">Seleccione una hora</option>
                      {HORAS_DISPONIBLES.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {form.fecha && form.hora && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Paso 2 — Elige un odontólogo disponible</p>
                  {buscandoOdontologos ? (
                    <div className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-400 bg-gray-50 animate-pulse">🔍 Buscando odontólogos disponibles...</div>
                  ) : sinOdontologos ? (
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm">⚠️ No hay odontólogos disponibles. Elige otra fecha u hora.</div>
                  ) : (
                    <select name="odontologo_id" value={form.odontologo_id} onChange={handleChange} required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50">
                      <option value="">Seleccione un odontólogo</option>
                      {odontologosDisponibles.map(d => <option key={d.id} value={d.id}>Dr. {d.nombre} {d.apellido}</option>)}
                    </select>
                  )}
                </div>
              )}

              {form.odontologo_id && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Paso 3 — Motivo (opcional)</p>
                  <textarea name="motivo" value={form.motivo} onChange={handleChange}
                    placeholder="Describe brevemente el motivo de tu visita" rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 resize-none" />
                </div>
              )}

              {puedeGuardar && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-sm">
                  💳 Al continuar se te cobrará <strong>S/ 20.00</strong> como adelanto de reserva.
                </div>
              )}

              <button type="submit" disabled={guardando || !puedeGuardar || sinOdontologos || buscandoOdontologos}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50">
                {guardando ? 'Preparando pago...' : '💳 Realizar pago y reservar'}
              </button>
            </form>
          </div>
        )}

        {vista === 'lista' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b">
              <h2 className="text-lg font-bold text-gray-800">Mis citas</h2>
            </div>
            {cargando ? (
              <div className="text-center py-16"><p className="text-gray-400 animate-pulse">Cargando tus citas...</p></div>
            ) : citas.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-5xl mb-4">📭</p>
                <p className="text-gray-600 font-medium">No tienes citas registradas aún</p>
                <button onClick={() => navigate('/paciente?vista=nueva')}
                  className="mt-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2 rounded-xl transition">
                  + Solicitar cita
                </button>
              </div>
            ) : (
              <div className="divide-y">
                {citas.map(cita => (
                  <div key={cita.id} className="px-6 py-5 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4 items-start">
                        <div className="bg-teal-50 rounded-xl p-3 text-center min-w-16">
                          <p className="text-xs text-teal-600 font-medium">{obtenerDiaSemana(cita.fecha).slice(0, 3).toUpperCase()}</p>
                          <p className="text-xl font-bold text-teal-700">{cita.fecha?.split('-')[2]}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">🕐 {cita.hora?.slice(0, 5)} hrs</p>
                          <p className="text-sm text-gray-500 mt-1">Dr. {cita.odontologo?.nombre} {cita.odontologo?.apellido}</p>
                          {cita.pagado && !cita.reembolsado && cita.estado !== 'cancelada' && (
                            <p className="text-xs text-teal-600 mt-1">💳 Adelanto pagado S/ 20.00</p>
                          )}
                          {cita.reembolsado && <p className="text-xs text-green-600 mt-1">✅ Reembolso procesado</p>}
                          {cita.pagado && !cita.reembolsado && cita.estado !== 'cancelada' && cita.estado !== 'completada' && cita.fecha_pago && (
                            <ContadorReembolso fechaPago={cita.fecha_pago} />
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${COLORES_ESTADO[cita.estado]}`}>{cita.estado}</span>
                        {cita.estado !== 'cancelada' && cita.estado !== 'completada' && (
                          <button onClick={() => setCitaACancelar(cita)}
                            className="text-xs text-red-500 hover:text-red-700 hover:underline transition">
                            Cancelar cita
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="bg-gray-900 text-gray-400 py-6 px-6 mt-12">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center gap-2"><span>🦷</span><span className="text-white font-semibold">DentaNovax</span></div>
          <p>© 2026 DentaNovax. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}