import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Navigate, useNavigate } from 'react-router-dom'
import { 
  User, Mail, Phone, MapPin, Calendar, Edit2, Save, X, Camera,
  Shield, Eye, EyeOff, ArrowLeft, UserCog, Scan
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function AdminPerfil() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [habilitarReconocimiento, setHabilitarReconocimiento] = useState(false)
  const [capturandoRostro, setCapturandoRostro] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    direccion: '',
    password_actual: '',
    password_nueva: '',
    password_confirmar: ''
  })

  // Redirigir si no es administrador
  if (user && user.tipo_usuario !== 'administrador') {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    if (user) {
      setFormData({
        nombres: user.nombres || '',
        apellidos: user.apellidos || '',
        email: user.email || '',
        telefono: user.telefono || '',
        direccion: user.direccion || '',
        password_actual: '',
        password_nueva: '',
        password_confirmar: ''
      })
      
      // Verificar si tiene reconocimiento facial habilitado
      verificarReconocimiento()
    }
  }, [user])

  const verificarReconocimiento = async () => {
    try {
      const response = await axios.get(`/api/usuarios/${user.id}/reconocimiento`)
      setHabilitarReconocimiento(response.data.habilitado)
    } catch (error) {
      console.error('Error verificando reconocimiento:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const dataToUpdate = {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        email: formData.email,
        telefono: formData.telefono,
        direccion: formData.direccion
      }

      // Si hay contraseña nueva, validar y agregar
      if (formData.password_nueva) {
        if (formData.password_nueva !== formData.password_confirmar) {
          toast.error('Las contraseñas no coinciden')
          return
        }
        if (formData.password_nueva.length < 6) {
          toast.error('La contraseña debe tener al menos 6 caracteres')
          return
        }
        dataToUpdate.password_actual = formData.password_actual
        dataToUpdate.password_nueva = formData.password_nueva
      }

      const response = await axios.put(`/api/usuarios/${user.id}/perfil`, dataToUpdate)
      
      if (response.data.success) {
        toast.success('Perfil actualizado correctamente')
        updateUser(response.data.usuario)
        setEditing(false)
        setFormData(prev => ({
          ...prev,
          password_actual: '',
          password_nueva: '',
          password_confirmar: ''
        }))
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al actualizar perfil')
    }
  }

  const iniciarCaptura = async () => {
    try {
      setCapturandoRostro(true)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
    } catch (error) {
      toast.error('No se pudo acceder a la cámara')
      console.error(error)
      setCapturandoRostro(false)
    }
  }

  const detenerCaptura = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCapturandoRostro(false)
  }

  const capturarFoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0)
      
      const fotoData = canvas.toDataURL('image/jpeg', 0.8)
      setFotoPreview(fotoData)
    }
  }

  const guardarReconocimientoFacial = async () => {
    if (!fotoPreview) {
      toast.error('Debes capturar una foto primero')
      return
    }

    try {
      const response = await axios.post('/api/usuarios/reconocimiento/registrar', {
        usuario_id: user.id,
        foto: fotoPreview
      })

      if (response.data.success) {
        toast.success('Reconocimiento facial configurado correctamente')
        setHabilitarReconocimiento(true)
        detenerCaptura()
        setFotoPreview(null)
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al configurar reconocimiento')
    }
  }

  const eliminarReconocimiento = async () => {
    if (!confirm('¿Estás seguro de desactivar el reconocimiento facial?')) {
      return
    }

    try {
      const response = await axios.delete(`/api/usuarios/${user.id}/reconocimiento`)
      
      if (response.data.success) {
        toast.success('Reconocimiento facial desactivado')
        setHabilitarReconocimiento(false)
      }
    } catch (error) {
      toast.error('Error al desactivar reconocimiento')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
                <p className="text-gray-600 mt-1">Gestiona tu información y configuración de seguridad</p>
              </div>
            </div>
            <UserCog className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Personal */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Información Personal</h2>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                ) : (
                  <button
                    onClick={() => setEditing(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Nombres
                    </label>
                    <input
                      type="text"
                      name="nombres"
                      value={formData.nombres}
                      onChange={handleChange}
                      disabled={!editing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Apellidos
                    </label>
                    <input
                      type="text"
                      name="apellidos"
                      value={formData.apellidos}
                      onChange={handleChange}
                      disabled={!editing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Dirección
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                {editing && (
                  <>
                    <div className="border-t border-gray-200 pt-4 mt-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Cambiar Contraseña</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contraseña Actual
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              name="password_actual"
                              value={formData.password_actual}
                              onChange={handleChange}
                              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nueva Contraseña
                          </label>
                          <input
                            type="password"
                            name="password_nueva"
                            value={formData.password_nueva}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirmar Nueva Contraseña
                          </label>
                          <input
                            type="password"
                            name="password_confirmar"
                            value={formData.password_confirmar}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                    >
                      <Save className="w-5 h-5" />
                      Guardar Cambios
                    </button>
                  </>
                )}
              </form>
            </div>
          </div>

          {/* Panel de Reconocimiento Facial */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Seguridad</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Scan className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Reconocimiento Facial</p>
                      <p className="text-xs text-gray-600">
                        {habilitarReconocimiento ? 'Activo' : 'Inactivo'}
                      </p>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${habilitarReconocimiento ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>

                {!habilitarReconocimiento && !capturandoRostro && (
                  <button
                    onClick={iniciarCaptura}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Camera className="w-5 h-5" />
                    Configurar Reconocimiento Facial
                  </button>
                )}

                {capturandoRostro && (
                  <div className="space-y-4">
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-auto"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                    </div>

                    {fotoPreview && (
                      <div className="relative">
                        <img
                          src={fotoPreview}
                          alt="Preview"
                          className="w-full h-auto rounded-lg border-2 border-green-500"
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      {!fotoPreview ? (
                        <button
                          onClick={capturarFoto}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          <Camera className="w-4 h-4" />
                          Capturar
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={guardarReconocimientoFacial}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                          >
                            <Save className="w-4 h-4" />
                            Guardar
                          </button>
                          <button
                            onClick={() => setFotoPreview(null)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                          >
                            Reintentar
                          </button>
                        </>
                      )}
                      <button
                        onClick={detenerCaptura}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {habilitarReconocimiento && (
                  <button
                    onClick={eliminarReconocimiento}
                    className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium"
                  >
                    Desactivar Reconocimiento Facial
                  </button>
                )}
              </div>
            </div>

            {/* Info del DNI */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg p-6">
              <h3 className="font-bold mb-2">Información de Acceso</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="opacity-90">DNI:</span>
                  <span className="font-bold">{user?.dni}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-90">Tipo:</span>
                  <span className="font-bold">Administrador</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-90">Fecha de Nacimiento:</span>
                  <span className="font-bold">
                    {user?.fecha_nacimiento ? new Date(user.fecha_nacimiento).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
