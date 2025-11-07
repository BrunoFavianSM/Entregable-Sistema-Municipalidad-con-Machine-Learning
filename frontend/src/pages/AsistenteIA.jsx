import { useState, useRef, useEffect } from 'react'
import Layout from '../components/Layout'
import { Bot, Send, Loader2, Sparkles, User } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'

export default function AsistenteIA() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola! Soy tu asistente virtual de la Municipalidad Provincial de Yau. Puedo ayudarte con información sobre trámites, requisitos, tiempos y más. ¿En qué puedo ayudarte hoy?'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!input.trim()) return

    const userMessage = input.trim()
    setInput('')

    // Agregar mensaje del usuario
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      setLoading(true)

      const response = await axios.post('/api/gemini/consultar', {
        pregunta: userMessage
      })

      if (response.data.success) {
        // Agregar respuesta del asistente
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: response.data.respuesta,
            tiempo: response.data.tiempo_respuesta_ms
          }
        ])
      } else {
        toast.error(response.data.error || 'Error al consultar')
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: 'Lo siento, no pude procesar tu consulta. Por favor, intenta de nuevo o contacta directamente con las oficinas municipales.',
            error: true
          }
        ])
      }
    } catch (error) {
      console.error('Error en consulta:', error)
      console.error('Error response:', error.response)
      toast.error('Error al comunicarse con el asistente')
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Lo siento, hubo un error al procesar tu consulta. Por favor, verifica tu conexión e intenta nuevamente.',
          error: true
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const sugerencias = [
    '¿Qué documentos necesito para una licencia de funcionamiento?',
    '¿Cuánto cuesta un certificado de domicilio?',
    '¿Cuánto tiempo demora un permiso de construcción?',
    '¿Cómo puedo registrar mi propiedad?'
  ]

  const handleSugerencia = (sugerencia) => {
    setInput(sugerencia)
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Asistente IA
              </h1>
              <p className="text-gray-600">
                Powered by Google Gemini
              </p>
            </div>
          </div>
        </div>

        {/* Chat container */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-purple-600" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.error
                      ? 'bg-red-50 text-red-900 border border-red-200'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="text-sm markdown-content">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  )}
                  {message.tiempo && (
                    <p className="text-xs text-gray-500 mt-2">
                      Respondido en {message.tiempo}ms
                    </p>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-purple-600" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                    <span className="text-sm text-gray-600">Pensando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sugerencias (siempre visibles) */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Preguntas sugeridas - Click para usarlas:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sugerencias.map((sugerencia, index) => (
                <button
                  key={index}
                  onClick={() => handleSugerencia(sugerencia)}
                  disabled={loading}
                  className="text-left text-sm px-3 py-2 bg-white border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sugerencia}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu pregunta aquí..."
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info */}
        <div className="mt-4 text-center text-sm text-gray-500">
          El asistente utiliza IA para proporcionar información. Para trámites oficiales, consulta directamente en las oficinas.
        </div>
      </div>
    </Layout>
  )
}
