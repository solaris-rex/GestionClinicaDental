// src/pages/odontologo/PanelOdontologo.jsx
import Navbar from '../../components/layout/Navbar'

export default function PanelOdontologo() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🦷 Panel Odontólogo
        </h2>
        <p className="text-gray-500">
          Desde aquí verás tu agenda y citas del día. (Módulos próximos)
        </p>
      </div>
    </div>
  )
}