import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import { User, Camera, Mail, Phone, MapPin, Calendar, Shield, Loader2, Lock, Key } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

export default function Perfil() {
  const { user, registerFace } = useAuth()
  const [showCamera, setShowCamera] = useState(false)
  const [loading, setLoading] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  // Estados para cambiar contraseña
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordConfirmar, setPasswordConfirmar] = useState('')

  // Estados para pregunta de seguridad
  const [preguntaSeleccionada, setPreguntaSeleccionada] = useState('')
  const [respuestaSecurity, setRespuestaSecurity] = useState('')

  const preguntasDisponibles = [
    '¿Cuál es el nombre de tu primera mascota?',
    '¿En qué ciudad naciste?',
    '¿Cuál es el nombre de tu mejor amigo de la infancia?',
    '¿Cuál es tu comida favorita?',
    '¿Cuál fue el nombre de tu primera escuela?'
  ]

  const startCamera = async () => {
    try {
      setShowCamera(true)
      
      // Esperar un momento para que el video element se monte
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // Esperar a que el video esté listo
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current.play()
            console.log('✅ Video reproduciendo')
          } catch (playErr) {
            console.error('Error al reproducir:', playErr)
            toast.error('Error al reproducir el video')
          }
        }
      }
    } catch (error) {
      toast.error('Error al acceder a la cámara')
      console.error(error)
      setShowCamera(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowCamera(false)
  }

  const captureAndRegister = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Cámara no disponible')
      return
    }
    
    const video = videoRef.current
    const canvas = canvasRef.current
    
    // Verificar que el video tenga dimensiones válidas
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('⏳ La cámara no está lista. Espera unos segundos e intenta de nuevo.')
      return
    }
    
    console.log('Capturando imagen...', video.videoWidth, 'x', video.videoHeight)
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    
    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    console.log('Imagen capturada, tamaño:', imageData.length, 'caracteres')
    
    stopCamera()
    setLoading(true)
    
    const success = await registerFace(imageData)
    setLoading(false)
    
    if (success) {
      toast.success('¡Rostro registrado! Ahora puedes usar login facial')
    }
  }

  const handleCambiarPassword = async (e) => {
    e.preventDefault()
    
    if (passwordNueva.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }

    if (passwordNueva !== passwordConfirmar) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    try {
      const response = await axios.post('/api/auth/cambiar-password', {
        password_actual: passwordActual,
        password_nueva: passwordNueva
      })

      if (response.data.success) {
        toast.success('Contraseña actualizada exitosamente')
        setPasswordActual('')
        setPasswordNueva('')
        setPasswordConfirmar('')
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al cambiar contraseña')
    }
  }

  const handleGuardarPregunta = async (e) => {
    e.preventDefault()

    if (!preguntaSeleccionada || !respuestaSecurity) {
      toast.error('Por favor completa todos los campos')
      return
    }

    if (respuestaSecurity.length < 3) {
      toast.error('La respuesta debe tener al menos 3 caracteres')
      return
    }

    try {
      const response = await axios.post('/api/auth/guardar-pregunta-seguridad', {
        pregunta: preguntaSeleccionada,
        respuesta: respuestaSecurity
      })

      if (response.data.success) {
        toast.success('Pregunta de seguridad guardada exitosamente')
        setPreguntaSeleccionada('')
        setRespuestaSecurity('')
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar pregunta')
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tu información personal y configuración
          </p>
        </div>

        {/* Información personal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {user?.nombres?.charAt(0)}{user?.apellidos?.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {user?.nombres} {user?.apellidos}
              </h2>
              <p className="text-gray-600">
                {user?.tipo_usuario === 'ciudadano' ? 'Ciudadano' : 
                 user?.tipo_usuario === 'funcionario' ? 'Funcionario' : 'Administrador'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">DNI</p>
                <p className="font-medium text-gray-900">{user?.dni}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-medium text-gray-900">{user?.telefono || 'No registrado'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Dirección</p>
                <p className="font-medium text-gray-900">{user?.direccion || 'No registrada'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reconocimiento facial */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Reconocimiento Facial
          </h2>

          {user?.tiene_face_encoding ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Camera className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-900">
                    ✅ Reconocimiento facial activado
                  </p>
                  <p className="text-sm text-green-700">
                    Puedes iniciar sesión usando tu rostro
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900">
                  <strong>Beneficios del reconocimiento facial:</strong>
                </p>
                <ul className="list-disc list-inside text-sm text-blue-800 mt-2 space-y-1">
                  <li>Inicio de sesión rápido y seguro</li>
                  <li>No necesitas recordar contraseñas</li>
                  <li>Mayor seguridad en tu cuenta</li>
                </ul>
              </div>

              {!showCamera ? (
                <button
                  onClick={startCamera}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Registrar Rostro
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden border-4 border-blue-500 bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full"
                      style={{ minHeight: '360px' }}
                    />
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  
                  <div className="flex gap-2">
                    <button
                      onClick={captureAndRegister}
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Registrando...
                        </>
                      ) : (
                        <>
                          <Camera className="w-5 h-5" />
                          Capturar y Registrar
                        </>
                      )}
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 text-center">
                    Asegúrate de tener buena iluminación y mira directamente a la cámara
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cambiar Contraseña */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Cambiar Contraseña
          </h2>

          <form onSubmit={handleCambiarPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña Actual
              </label>
              <input
                type="password"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                minLength={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mínimo 8 caracteres"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                value={passwordConfirmar}
                onChange={(e) => setPasswordConfirmar(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Actualizar Contraseña
            </button>
          </form>
        </div>

        {/* Pregunta de Seguridad */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Key className="w-5 h-5" />
            Pregunta de Seguridad
          </h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-900">
              Configura una pregunta de seguridad para recuperar tu contraseña en caso de olvidarla.
            </p>
          </div>

          <form onSubmit={handleGuardarPregunta} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona una Pregunta
              </label>
              <select
                value={preguntaSeleccionada}
                onChange={(e) => setPreguntaSeleccionada(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">-- Selecciona una pregunta --</option>
                {preguntasDisponibles.map((pregunta, index) => (
                  <option key={index} value={pregunta}>
                    {pregunta}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tu Respuesta
              </label>
              <input
                type="text"
                value={respuestaSecurity}
                onChange={(e) => setRespuestaSecurity(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Escribe tu respuesta (recuérdala bien)"
                minLength={3}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Guarda esta respuesta de forma segura. La necesitarás para recuperar tu contraseña.
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Guardar Pregunta de Seguridad
            </button>
          </form>
        </div>

        {/* Información adicional */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="font-bold text-yellow-900 mb-2">
            🔒 Seguridad y Privacidad
          </h3>
          <ul className="space-y-1 text-sm text-yellow-800">
            <li>• Tu información facial está encriptada y protegida</li>
            <li>• Solo tú puedes acceder a tu cuenta con tu rostro</li>
            <li>• Puedes desactivar el reconocimiento facial en cualquier momento</li>
            <li>• Cumplimos con todas las leyes de protección de datos</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}
