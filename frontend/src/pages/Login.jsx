import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Building2, Camera, User, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  
  // Login
  const [dni, setDni] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // Cámara
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    
    if (!dni || dni.length < 8) {
      toast.error('DNI inválido')
      return
    }
    
    if (!password) {
      toast.error('Contraseña requerida')
      return
    }
    
    setLoading(true)
    const success = await login(dni, password)
    setLoading(false)
    
    if (success) {
      navigate('/dashboard')
    }
  }


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
      toast.error('Error al acceder a la cámara. Asegúrate de permitir el acceso.')
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

  const captureAndLogin = async () => {
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
    
    const success = await login(null, null, true, imageData)
    setLoading(false)
    
    if (success) {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
              <Building2 className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Municipalidad Provincial de Yau
          </h1>
          <p className="text-gray-600">
            Sistema de Gestión de Trámites
          </p>
        </div>

        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Login Form */}
          {!showCamera && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DNI
                </label>
                <input
                  type="text"
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="Ingresa tu DNI"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={8}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5" />
                    Iniciar Sesión
                  </>
                )}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">O también</span>
                </div>
              </div>

              <button
                type="button"
                onClick={startCamera}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Iniciar con Reconocimiento Facial
              </button>
            </form>
          )}

          {/* Cámara para login facial */}
          {showCamera && (
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
                  onClick={captureAndLogin}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5" />
                      Capturar e Iniciar Sesión
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
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="mt-6 text-center space-y-3">
          <p className="text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Regístrate aquí
            </Link>
          </p>
          <p className="text-gray-600">
            <Link to="/recuperar-password" className="text-blue-600 hover:text-blue-700 font-semibold">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
          <p className="text-sm text-gray-600">
            Sistema desarrollado con Machine Learning e Inteligencia Artificial
          </p>
        </div>
      </div>
    </div>
  )
}
