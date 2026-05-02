// src/pages/Landing.jsx
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Landing() {
  const navigate = useNavigate()
  const { usuario, perfil, cerrarSesion, cargando } = useAuth()

  // Función para manejar reserva de cita
  function handleReservar() {
    if (cargando) return // esperar a que cargue
    if (usuario && perfil) {
      navigate('/paciente')
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen font-sans">

      {/* ===== NAVBAR ===== */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦷</span>
            <span className="text-xl font-bold text-teal-700">DentaNovax</span>
          </div>

          {/* Links de navegación */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#inicio" className="hover:text-teal-600 transition">Inicio</a>
            <a href="#servicios" className="hover:text-teal-600 transition">Servicios</a>
            <a href="#nosotros" className="hover:text-teal-600 transition">Nosotros</a>
            <a href="#contacto" className="hover:text-teal-600 transition">Contacto</a>
          </div>

          {/* Botón login / usuario */}
          <div className="flex items-center gap-3">
            {cargando ? (
              // Mientras carga mostrar placeholder
              <div className="w-32 h-9 bg-gray-100 rounded-lg animate-pulse" />
            ) : usuario && perfil ? (
              <>
                <button
                  onClick={() => navigate('/paciente')}
                  className="text-sm font-medium text-teal-700 hover:underline flex items-center gap-1"
                >
                  👤 {perfil.nombre} {perfil.apellido}
                </button>
                <button
                  onClick={cerrarSesion}
                  className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
              >
                Iniciar sesión
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ===== HERO / INICIO ===== */}
      <section id="inicio" className="bg-gradient-to-br from-teal-50 to-cyan-100 py-24 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <p className="text-teal-600 font-semibold text-sm uppercase tracking-widest mb-3">
              Clínica Dental de Confianza
            </p>
            <h1 className="text-5xl font-bold text-gray-800 leading-tight mb-6">
              Tu sonrisa perfecta <br />
              <span className="text-teal-600">comienza aquí</span>
            </h1>
            <p className="text-gray-500 text-lg mb-8 leading-relaxed">
              En DentaNovax te ofrecemos atención dental de calidad, con tecnología moderna y profesionales comprometidos con tu salud bucal.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleReservar}
                disabled={cargando}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl transition shadow-lg disabled:opacity-70"
              >
                Reservar cita online
              </button>
              <a
                href="#servicios"
                className="border-2 border-teal-600 text-teal-600 hover:bg-teal-50 font-semibold px-6 py-3 rounded-xl transition"
              >
                Ver servicios
              </a>
            </div>
          </div>

          {/* Tarjetas de estadísticas */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            {[
              { numero: '10+', label: 'Años de experiencia', icono: '🏆' },
              { numero: '5,000+', label: 'Pacientes atendidos', icono: '😊' },
              { numero: '8', label: 'Especialistas', icono: '👨‍⚕️' },
              { numero: '100%', label: 'Satisfacción', icono: '⭐' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-md text-center">
                <p className="text-3xl mb-2">{stat.icono}</p>
                <p className="text-2xl font-bold text-teal-700">{stat.numero}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== IMPORTANCIA DEL CUIDADO DENTAL ===== */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            ¿Por qué es importante el cuidado dental?
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            La salud bucal es un reflejo de tu salud general. Descuidar tus dientes puede traer consecuencias que van mucho más allá de tu sonrisa.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icono: '🦷',
              titulo: 'Prevención de enfermedades',
              descripcion: 'Las revisiones regulares permiten detectar caries, enfermedades de las encías y otros problemas antes de que se agraven.',
            },
            {
              icono: '❤️',
              titulo: 'Salud general',
              descripcion: 'Las bacterias bucales pueden afectar el corazón, los pulmones y otros órganos. Una boca sana contribuye a un cuerpo sano.',
            },
            {
              icono: '😁',
              titulo: 'Confianza y bienestar',
              descripcion: 'Una sonrisa saludable mejora tu autoestima y bienestar emocional, impactando positivamente en tu vida social y profesional.',
            },
          ].map((item) => (
            <div key={item.titulo} className="bg-teal-50 rounded-2xl p-8 text-center hover:shadow-lg transition">
              <p className="text-5xl mb-4">{item.icono}</p>
              <h3 className="text-lg font-bold text-gray-800 mb-3">{item.titulo}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.descripcion}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== SERVICIOS ===== */}
      <section id="servicios" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Nuestros Servicios</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Ofrecemos una amplia gama de tratamientos dentales para toda la familia.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-6">
          {[
            { icono: '🔍', nombre: 'Diagnóstico y Revisión', desc: 'Evaluación completa de tu salud bucal.' },
            { icono: '✨', nombre: 'Limpieza Dental', desc: 'Eliminación de placa y sarro profesional.' },
            { icono: '🦷', nombre: 'Tratamiento de Caries', desc: 'Restauración con materiales de alta calidad.' },
            { icono: '😬', nombre: 'Ortodoncia', desc: 'Corrección dental con brackets o invisalign.' },
            { icono: '💎', nombre: 'Estética Dental', desc: 'Blanqueamiento y carillas para tu sonrisa.' },
            { icono: '🔧', nombre: 'Implantes', desc: 'Soluciones permanentes para dientes perdidos.' },
          ].map((servicio) => (
            <div key={servicio.nombre} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition text-center">
              <p className="text-4xl mb-3">{servicio.icono}</p>
              <h3 className="font-bold text-gray-800 mb-2">{servicio.nombre}</h3>
              <p className="text-sm text-gray-500">{servicio.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== MISIÓN Y VISIÓN ===== */}
      <section id="nosotros" className="py-20 px-6 bg-teal-700 text-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-8">Nuestra Misión y Visión</h2>
            <div className="space-y-6">
              <div className="bg-white bg-opacity-10 rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-3">🎯 Misión</h3>
                <p className="text-teal-100 leading-relaxed">
                  Brindar atención odontológica integral de alta calidad, con calidez humana y tecnología de vanguardia, mejorando la salud bucal y la calidad de vida de nuestros pacientes.
                </p>
              </div>
              <div className="bg-white bg-opacity-10 rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-3">🔭 Visión</h3>
                <p className="text-teal-100 leading-relaxed">
                  Ser la clínica dental líder de la región, reconocida por la excelencia en nuestros tratamientos, la satisfacción de nuestros pacientes y el compromiso con la innovación continua.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icono: '🏅', titulo: 'Calidad', desc: 'Materiales y equipos de última generación.' },
              { icono: '🤝', titulo: 'Compromiso', desc: 'Dedicados al bienestar de cada paciente.' },
              { icono: '🔬', titulo: 'Innovación', desc: 'Técnicas modernas y minimamente invasivas.' },
              { icono: '💙', titulo: 'Confianza', desc: 'Relación cercana y transparente contigo.' },
            ].map((valor) => (
              <div key={valor.titulo} className="bg-white bg-opacity-10 rounded-2xl p-5 text-center">
                <p className="text-3xl mb-2">{valor.icono}</p>
                <p className="font-bold">{valor.titulo}</p>
                <p className="text-xs text-teal-200 mt-1">{valor.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTACTO ===== */}
      <section id="contacto" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Contáctanos</h2>
          <p className="text-gray-500">Estamos aquí para atenderte. No dudes en comunicarte con nosotros.</p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icono: '📍', titulo: 'Dirección', info: 'Av. Principal 123, Ayacucho, Perú' },
            { icono: '📞', titulo: 'Teléfono', info: '+51 966 123 456' },
            { icono: '🕐', titulo: 'Horario', info: 'Lun - Sáb: 8:00am - 6:00pm' },
          ].map((item) => (
            <div key={item.titulo} className="text-center p-6 bg-teal-50 rounded-2xl">
              <p className="text-4xl mb-3">{item.icono}</p>
              <p className="font-bold text-gray-800 mb-1">{item.titulo}</p>
              <p className="text-sm text-gray-500">{item.info}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <button
            onClick={handleReservar}
            disabled={cargando}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-8 py-3 rounded-xl transition shadow-lg text-lg disabled:opacity-70"
          >
            🦷 Reservar mi cita ahora
          </button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🦷</span>
              <span className="text-xl font-bold text-white">DentaNovax</span>
            </div>
            <p className="text-sm leading-relaxed">
              Comprometidos con tu salud bucal y tu bienestar. Atención profesional con calidez humana.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Enlaces rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#inicio" className="hover:text-teal-400 transition">Inicio</a></li>
              <li><a href="#servicios" className="hover:text-teal-400 transition">Servicios</a></li>
              <li><a href="#nosotros" className="hover:text-teal-400 transition">Nosotros</a></li>
              <li><a href="#contacto" className="hover:text-teal-400 transition">Contacto</a></li>
              <li>
                <button
                  onClick={() => navigate('/login')}
                  className="hover:text-teal-400 transition"
                >
                  Iniciar sesión
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Información</h4>
            <ul className="space-y-2 text-sm">
              <li>📍 Av. Principal 123, Ayacucho</li>
              <li>📞 +51 966 123 456</li>
              <li>✉️ contacto@dentanovax.com</li>
              <li>🕐 Lun - Sáb: 8:00am - 6:00pm</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center text-sm">
          <p>© 2026 DentaNovax. Todos los derechos reservados.</p>
        </div>
      </footer>

    </div>
  )
}