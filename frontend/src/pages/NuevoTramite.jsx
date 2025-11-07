import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import FileUpload from '../components/FileUpload'
import ReactMarkdown from 'react-markdown'
import { 
  FileText, Loader2, CheckCircle, Info, Sparkles, Bot,
  DollarSign, Home, Building, FileCheck, AlertTriangle, 
  Users, Car, Lightbulb, HelpCircle
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function NuevoTramite() {
  const navigate = useNavigate()
  const location = useLocation()
  const [tiposTramite, setTiposTramite] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loadingIA, setLoadingIA] = useState(false)
  const [formData, setFormData] = useState({
    tipo_tramite_id: '',
    descripcion: ''
  })
  const [selectedTipo, setSelectedTipo] = useState(null)
  const [archivos, setArchivos] = useState([])
  const [mostrarPreview, setMostrarPreview] = useState(false)

  useEffect(() => {
    loadTiposTramite()
    // Si viene con un tipo pre-seleccionado desde Tramites.jsx
    if (location.state?.tipoTramite) {
      const tipo = location.state.tipoTramite
      setFormData({ ...formData, tipo_tramite_id: tipo.id.toString() })
      setSelectedTipo(tipo)
    }
  }, [])

  const loadTiposTramite = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/tramites/tipos')
      setTiposTramite(response.data.tipos_tramite || [])
    } catch (error) {
      console.error('Error cargando tipos:', error)
      setTiposTramite([])
    } finally {
      setLoading(false)
    }
  }

  const handleTipoChange = (tipoId) => {
    setFormData({ ...formData, tipo_tramite_id: tipoId })
    const tipo = tiposTramite.find(t => t.id === parseInt(tipoId))
    setSelectedTipo(tipo)
  }

  const ayudarConIA = async () => {
    if (!formData.tipo_tramite_id) {
      toast.error('Primero selecciona un tipo de trámite')
      return
    }

    try {
      setLoadingIA(true)
      const response = await axios.post('/api/gemini/ayudar-redactar', {
        tipo_tramite_id: formData.tipo_tramite_id,
        descripcion_usuario: formData.descripcion || 'Necesito ayuda para redactar mi solicitud'
      })

      if (response.data.success) {
        setFormData({ ...formData, descripcion: response.data.respuesta })
        toast.success('¡La IA ha mejorado tu solicitud!')
      } else {
        toast.error(response.data.error || 'Error al generar sugerencia')
      }
    } catch (error) {
      console.error('Error con IA:', error)
      toast.error('Error al conectar con la IA')
    } finally {
      setLoadingIA(false)
    }
  }

  const convertirArchivosABase64 = async (files) => {
    const archivosBase64 = []
    
    for (const file of files) {
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(file)
      })
      
      archivosBase64.push({
        nombre: file.name,
        tipo: file.type,
        tamaño: file.size,
        data: base64
      })
    }
    
    return archivosBase64
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.tipo_tramite_id) {
      toast.error('Selecciona un tipo de trámite')
      return
    }

    try {
      setSubmitting(true)
      
      // Convertir archivos a base64
      const documentos = archivos.length > 0 
        ? await convertirArchivosABase64(archivos)
        : []
      
      const dataToSend = {
        ...formData,
        documentos
      }
      
      const response = await axios.post('/api/tramites', dataToSend)
      
      toast.success(
        `Trámite creado exitosamente. Código: ${response.data.tramite.codigo}`,
        { duration: 5000 }
      )
      
      setTimeout(() => {
        navigate('/mis-tramites')
      }, 1500)
    } catch (error) {
      console.error('Error creando trámite:', error)
      toast.error(error.response?.data?.error || 'Error al crear trámite')
    } finally {
      setSubmitting(false)
    }
  }

  const categorias = {
    'impuestos_pagos': { 
      nombre: 'Impuestos y Pagos', 
      icono: DollarSign, 
      color: 'bg-green-50 text-green-700 border-green-200'
    },
    'catastro_propiedad': { 
      nombre: 'Catastro y Propiedad', 
      icono: Home, 
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    'licencias': { 
      nombre: 'Licencias', 
      icono: FileCheck, 
      color: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    'obras_construccion': { 
      nombre: 'Obras y Construcción', 
      icono: Building, 
      color: 'bg-orange-50 text-orange-700 border-orange-200'
    },
    'quejas_denuncias': { 
      nombre: 'Quejas y Denuncias', 
      icono: AlertTriangle, 
      color: 'bg-red-50 text-red-700 border-red-200'
    },
    'registro_civil': { 
      nombre: 'Registro Civil', 
      icono: Users, 
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    'transporte_transito': { 
      nombre: 'Transporte y Tránsito', 
      icono: Car, 
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200'
    },
    'servicios_municipales': { 
      nombre: 'Servicios Municipales', 
      icono: Lightbulb, 
      color: 'bg-teal-50 text-teal-700 border-teal-200'
    },
    'atencion_ciudadano': { 
      nombre: 'Atención al Ciudadano', 
      icono: HelpCircle, 
      color: 'bg-pink-50 text-pink-700 border-pink-200'
    }
  }

  // Agrupar trámites por categoría
  const tramitesPorCategoria = tiposTramite.reduce((acc, tramite) => {
    const categoria = tramite.categoria || 'otros'
    if (!acc[categoria]) {
      acc[categoria] = []
    }
    acc[categoria].push(tramite)
    return acc
  }, {})

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando formulario...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Trámite</h1>
          <p className="text-gray-600 mt-1">
            Completa el formulario para iniciar tu trámite
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selección de tipo de trámite por categorías */}
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
              <h2 className="text-2xl font-bold mb-1">Selecciona el Tipo de Trámite</h2>
              <p className="text-blue-100">Elige la categoría y luego el trámite específico</p>
            </div>

            {Object.entries(tramitesPorCategoria).map(([categoriaKey, tramites]) => {
              const categoria = categorias[categoriaKey]
              if (!categoria || tramites.length === 0) return null
              
              const IconComponent = categoria.icono
              
              return (
                <div key={categoriaKey} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Header de Categoría */}
                  <div className={`${categoria.color} border-b-2 p-4`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{categoria.nombre}</h3>
                        <p className="text-sm opacity-80">{tramites.length} trámite(s) disponible(s)</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Trámites de la Categoría */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tramites.map((tipo) => (
                      <label
                        key={tipo.id}
                        className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          formData.tipo_tramite_id === tipo.id.toString()
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                        }`}
                      >
                        <input
                          type="radio"
                          name="tipo_tramite"
                          value={tipo.id}
                          checked={formData.tipo_tramite_id === tipo.id.toString()}
                          onChange={(e) => handleTipoChange(e.target.value)}
                          className="mt-1"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="font-semibold text-gray-900 leading-tight">
                              {tipo.nombre}
                            </span>
                            <span className="text-xs font-mono text-gray-400 flex-shrink-0">
                              {tipo.codigo}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {tipo.descripcion}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1 text-gray-600">
                              <span className="font-medium">⏱️ {tipo.tiempo_estimado_dias} días</span>
                            </span>
                            <span className="px-2 py-1 bg-green-50 text-green-700 font-bold rounded-lg">
                              S/ {Number(tipo.costo).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Información del trámite seleccionado */}
          {selectedTipo && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-blue-900 mb-2">
                    Información del Trámite
                  </h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p><strong>Costo:</strong> S/ {selectedTipo.costo}</p>
                    <p><strong>Tiempo estimado:</strong> {selectedTipo.tiempo_estimado_dias} días hábiles</p>
                    <p><strong>Categoría:</strong> {selectedTipo.categoria}</p>
                    {selectedTipo.requisitos && (
                      <div>
                        <strong>Requisitos:</strong>
                        <p className="mt-1">{selectedTipo.requisitos}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Descripción con IA */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Descripción (Opcional)
              </h2>
              <button
                type="button"
                onClick={ayudarConIA}
                disabled={loadingIA || !formData.tipo_tramite_id}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingIA ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Ayuda con IA
                  </>
                )}
              </button>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <Bot className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-purple-900">
                  <strong>¿Necesitas ayuda?</strong> La IA puede redactar una solicitud formal y profesional basada en tu trámite. Solo haz click en "Ayuda con IA" ✨
                </p>
              </div>
            </div>
            
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Escribe aquí los detalles de tu solicitud, o usa la IA para que te ayude a redactarla..."
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            
            {/* Botón para mostrar preview */}
            {formData.descripcion && (
              <div className="flex items-center justify-between mt-3">
                <p className="text-sm text-gray-500">
                  Proporciona información adicional que pueda ayudar a procesar tu trámite
                </p>
                <button
                  type="button"
                  onClick={() => setMostrarPreview(!mostrarPreview)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {mostrarPreview ? 'Ocultar' : 'Ver'} Vista Previa
                </button>
              </div>
            )}
            
            {/* Preview con markdown */}
            {mostrarPreview && formData.descripcion && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs font-medium text-gray-600 mb-2">Vista Previa:</p>
                <div className="text-sm markdown-content prose prose-sm max-w-none">
                  <ReactMarkdown>{formData.descripcion}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {/* Upload de Archivos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Documentos Adjuntos (Opcional)
            </h2>
            <FileUpload 
              onFilesChange={setArchivos}
              maxFiles={5}
              maxSize={10}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting || !formData.tipo_tramite_id}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando trámite...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Crear Trámite
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>

        {/* Información adicional */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="font-bold text-yellow-900 mb-2">
            📋 Importante
          </h3>
          <ul className="space-y-1 text-sm text-yellow-800">
            <li>• Una vez creado el trámite, recibirás un código único para su seguimiento</li>
            <li>• El sistema priorizará automáticamente tu trámite usando Machine Learning</li>
            <li>• Recibirás notificaciones sobre cualquier cambio en el estado</li>
            <li>• Puedes consultar el estado en cualquier momento desde "Mis Trámites"</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}
