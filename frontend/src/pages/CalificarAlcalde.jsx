import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { Star, Send, ArrowLeft, Sparkles, Heart, ThumbsUp } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function CalificarAlcalde() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [calificacion, setCalificacion] = useState(0)
  const [hoverCalificacion, setHoverCalificacion] = useState(0)
  const [comentario, setComentario] = useState('')
  const [loading, setLoading] = useState(false)
  const [yaCalificado, setYaCalificado] = useState(false)

  // Redirigir si es admin
  if (user && user.tipo_usuario === 'administrador') {
    return <Navigate to="/admin" replace />
  }

  useEffect(() => {
    cargarCalificacionExistente()
  }, [])

  const cargarCalificacionExistente = async () => {
    try {
      const response = await axios.get('/api/calificaciones/mi-calificacion')
      if (response.data.calificacion) {
        setCalificacion(response.data.calificacion.calificacion)
        setComentario(response.data.calificacion.comentario || '')
        setYaCalificado(true)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (calificacion === 0) {
      toast.error('Por favor selecciona una calificación')
      return
    }

    try {
      setLoading(true)
      await axios.post('/api/calificaciones/calificar', {
        calificacion,
        comentario
      })

      toast.success(yaCalificado ? 'Calificación actualizada' : 'Gracias por tu calificación')
      setYaCalificado(true)
      
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al enviar calificación')
    } finally {
      setLoading(false)
    }
  }

  const mensajesCalificacion = {
    1: 'Muy insatisfecho',
    2: 'Insatisfecho',
    3: 'Neutral',
    4: 'Satisfecho',
    5: 'Muy satisfecho'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Califica la Gestión Municipal
              </h1>
              <p className="text-gray-600 mt-1">
                Tu opinión nos ayuda a mejorar
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          
          {/* Icono central */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¿Cómo calificarías la gestión del alcalde?
            </h2>
            <p className="text-gray-600">
              Ayúdanos a mejorar nuestros servicios municipales
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Estrellas de calificación */}
            <div>
              <label className="block text-center text-sm font-medium text-gray-700 mb-4">
                Selecciona tu calificación
              </label>
              <div className="flex justify-center gap-3 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCalificacion(star)}
                    onMouseEnter={() => setHoverCalificacion(star)}
                    onMouseLeave={() => setHoverCalificacion(0)}
                    className="transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-12 h-12 ${
                        star <= (hoverCalificacion || calificacion)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              {(hoverCalificacion || calificacion) > 0 && (
                <p className="text-center text-lg font-semibold text-purple-600 animate-fade-in">
                  {mensajesCalificacion[hoverCalificacion || calificacion]}
                </p>
              )}
            </div>

            {/* Comentario opcional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentario (Opcional)
              </label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Cuéntanos tu experiencia con los servicios municipales..."
              />
              <p className="text-xs text-gray-500 mt-2">
                Tu comentario será anónimo y nos ayudará a mejorar
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading || calificacion === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {yaCalificado ? 'Actualizando...' : 'Enviando...'}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {yaCalificado ? 'Actualizar Calificación' : 'Enviar Calificación'}
                  </>
                )}
              </button>
              <Link
                to="/dashboard"
                className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition"
              >
                Cancelar
              </Link>
            </div>
          </form>

          {/* Mensaje si ya calificó */}
          {yaCalificado && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <ThumbsUp className="w-5 h-5" />
                <p className="text-sm font-medium">
                  Ya has calificado anteriormente. Puedes actualizar tu calificación cuando quieras.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-200">
            <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Tu opinión cuenta</p>
            <p className="text-xs text-gray-600 mt-1">Cada calificación nos ayuda</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-200">
            <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Anónima</p>
            <p className="text-xs text-gray-600 mt-1">Tu identidad está protegida</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-200">
            <Sparkles className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Mejora continua</p>
            <p className="text-xs text-gray-600 mt-1">Trabajamos para ti</p>
          </div>
        </div>
      </div>
    </div>
  )
}
