import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { 
  Bot, Send, Loader2, Sparkles, ArrowLeft, LogOut,
  TrendingUp, FileText, Users, CheckCircle
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'

export default function AdminIA() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Redirigir si no es administrador
  if (user && user.tipo_usuario !== 'administrador') {
    return <Navigate to="/dashboard" replace />
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const sugerenciasAdmin = [
    {
      icono: TrendingUp,
      titulo: 'Optimizar Procesos',
      pregunta: '¿Cómo puedo optimizar el procesamiento de trámites en la municipalidad?'
    },
    {
      icono: FileText,
      titulo: 'Gestión de Documentos',
      pregunta: '¿Qué estrategias puedo usar para mejorar la gestión documental municipal?'
    },
    {
      icono: Users,
      titulo: 'Atención Ciudadana',
      pregunta: 'Dame sugerencias para mejorar la atención y satisfacción de los ciudadanos'
    },
    {
      icono: CheckCircle,
      titulo: 'Eficiencia Administrativa',
      pregunta: '¿Cómo puedo reducir los tiempos de respuesta en los trámites municipales?'
    }
  ]

  const handleSugerencia = (pregunta) => {
    setInputMessage(pregunta)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!inputMessage.trim()) return

    const userMessage = {
      role: 'user',
      content: inputMessage
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setLoading(true)

    try {
      const response = await axios.post('/api/gemini/consultar-admin', {
        pregunta: inputMessage
      })

      if (response.data.success) {
        const assistantMessage = {
          role: 'assistant',
          content: response.data.respuesta
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        toast.error(response.data.error || 'Error al consultar con la IA')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al conectar con el asistente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/admin"
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Bot className="w-8 h-8 text-purple-600" />
                  Asistente IA Administrativo
                </h1>
                <p className="text-gray-600 mt-1">
                  Consultas y sugerencias para gestión municipal
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" style={{ height: 'calc(100vh - 250px)' }}>
          
          {/* Sugerencias iniciales */}
          {messages.length === 0 && (
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  ¿En qué puedo ayudarte hoy?
                </h2>
                <p className="text-gray-600">
                  Soy tu asistente para mejorar la gestión administrativa
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sugerenciasAdmin.map((sugerencia, idx) => {
                  const Icon = sugerencia.icono
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSugerencia(sugerencia.pregunta)}
                      className="p-4 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition">
                          <Icon className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {sugerencia.titulo}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {sugerencia.pregunta}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Chat de mensajes */}
          {messages.length > 0 && (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div className="markdown-content prose prose-sm max-w-none">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Input de mensaje */}
        <div className="mt-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Escribe tu consulta administrativa..."
              className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900 placeholder-gray-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="px-8 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Consultando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Enviar
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
