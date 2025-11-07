import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Navigate, Link, useSearchParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { 
  ArrowLeft, Filter, Search, Eye, MessageSquare, 
  FileText, Clock, User, Calendar, LogOut, Image, Video, File, Download, X, Bot, Upload, FileDown
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function AdminTramites() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tramites, setTramites] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState(searchParams.get('estado') || '')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [tramiteSeleccionado, setTramiteSeleccionado] = useState(null)
  const [showModal, setShowModal] = useState(false)

  //Estados para responder
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [respuesta, setRespuesta] = useState('')
  const [loadingRespuesta, setLoadingRespuesta] = useState(false)
  const [archivosAdmin, setArchivosAdmin] = useState([])

  // Redirigir si no es administrador
  if (user && user.tipo_usuario !== 'administrador') {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    cargarTramites()
  }, [filtroEstado, filtroCategoria])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const cargarTramites = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filtroEstado) params.append('estado', filtroEstado)
      if (filtroCategoria) params.append('categoria', filtroCategoria)

      const response = await axios.get(`/api/admin/tramites?${params}`)
      setTramites(response.data.tramites)
    } catch (error) {
      toast.error('Error al cargar trámites')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const abrirModal = (tramite) => {
    setTramiteSeleccionado(tramite)
    setNuevoEstado(tramite.estado)
    setRespuesta(tramite.respuesta_admin || '')
    setShowModal(true)
  }

  const cerrarModal = () => {
    setShowModal(false)
    setTramiteSeleccionado(null)
    setNuevoEstado('')
    setRespuesta('')
    setArchivosAdmin([])
  }

  const exportarTramite = async (tramiteId, formato) => {
    try {
      toast.loading(`Generando ${formato.toUpperCase()}...`)
      
      const response = await axios.get(`/api/tramites/${tramiteId}/exportar/${formato}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Tramite_${tramiteId}.${formato}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast.dismiss()
      toast.success(`Documento ${formato.toUpperCase()} descargado`)
    } catch (error) {
      toast.dismiss()
      toast.error('Error al exportar documento')
      console.error(error)
    }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (archivosAdmin.length + files.length > 5) {
      toast.error('Máximo 5 archivos')
      return
    }
    setArchivosAdmin([...archivosAdmin, ...files])
  }

  const removeFile = (index) => {
    setArchivosAdmin(archivosAdmin.filter((_, i) => i !== index))
  }

  const handleResponder = async (e) => {
    e.preventDefault()
    
    if (!nuevoEstado) {
      toast.error('Selecciona un estado')
      return
    }

    try {
      setLoadingRespuesta(true)
      
      // Convertir archivos a base64
      const documentosAdmin = []
      for (const file of archivosAdmin) {
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(file)
        })
        
        documentosAdmin.push({
          nombre: file.name,
          tipo: file.type,
          tamaño: file.size,
          data: base64
        })
      }
      
      await axios.post(`/api/admin/tramites/${tramiteSeleccionado.id}/responder`, {
        estado: nuevoEstado,
        respuesta: respuesta,
        documentos_admin: documentosAdmin
      })

      toast.success('Trámite actualizado exitosamente')
      cerrarModal()
      cargarTramites()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al actualizar trámite')
      console.error(error)
    } finally {
      setLoadingRespuesta(false)
    }
  }

  const getEstadoBadge = (estado) => {
    const estilos = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      en_revision: 'bg-blue-100 text-blue-800',
      observado: 'bg-orange-100 text-orange-800',
      aprobado: 'bg-green-100 text-green-800',
      rechazado: 'bg-red-100 text-red-800',
      completado: 'bg-gray-100 text-gray-800'
    }
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${estilos[estado] || 'bg-gray-100 text-gray-800'}`}>
        {estado.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  const tramitesFiltrados = tramites.filter(tramite => {
    const cumpleBusqueda = busqueda === '' || 
      tramite.codigo_tramite.toLowerCase().includes(busqueda.toLowerCase()) ||
      tramite.usuario_dni.includes(busqueda) ||
      tramite.usuario_nombre.toLowerCase().includes(busqueda.toLowerCase())
    
    return cumpleBusqueda
  })

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
                <h1 className="text-3xl font-bold text-gray-900">
                  Gestión de Trámites
                </h1>
                <p className="text-gray-600 mt-1">
                  {tramitesFiltrados.length} trámite(s) encontrado(s)
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Buscar
              </label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Código, DNI o nombre..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Filtro Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Estado
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_revision">En Revisión</option>
                <option value="observado">Observado</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
                <option value="completado">Completado</option>
              </select>
            </div>

            {/* Filtro Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Categoría
              </label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Todas</option>
                <option value="impuestos_pagos">Impuestos y Pagos</option>
                <option value="catastro_propiedad">Catastro y Propiedad</option>
                <option value="licencias">Licencias</option>
                <option value="obras_construccion">Obras y Construcción</option>
                <option value="quejas_denuncias">Quejas y Denuncias</option>
                <option value="registro_civil">Registro Civil</option>
                <option value="transporte_transito">Transporte y Tránsito</option>
                <option value="servicios_municipales">Servicios Municipales</option>
                <option value="atencion_ciudadano">Atención al Ciudadano</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de Trámites */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando trámites...</p>
          </div>
        ) : tramitesFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron trámites</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tramitesFiltrados.map((tramite) => (
              <div
                key={tramite.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Información principal */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">
                          {tramite.tipo_nombre}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Código: <span className="font-mono font-medium">{tramite.codigo_tramite}</span>
                        </p>
                        
                        {/* Datos del ciudadano */}
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{tramite.usuario_nombre}</span>
                          <span className="text-gray-400">•</span>
                          <span>DNI: {tramite.usuario_dni}</span>
                        </div>
                        
                        {/* Descripción previa si existe */}
                        {tramite.descripcion && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {tramite.descripcion.substring(0, 100)}...
                          </p>
                        )}
                        
                        {/* Preview de archivos adjuntos */}
                        {tramite.documentos_adjuntos && JSON.parse(tramite.documentos_adjuntos || '[]').length > 0 && (
                          <div className="mt-3 flex items-center gap-2">
                            <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              <FileText className="w-3 h-3" />
                              <span>{JSON.parse(tramite.documentos_adjuntos || '[]').length} archivos adjuntos</span>
                            </div>
                            <div className="flex gap-1">
                              {JSON.parse(tramite.documentos_adjuntos || '[]').slice(0, 3).map((doc, idx) => (
                                <div key={idx} className="relative group">
                                  {doc.tipo?.startsWith('image/') ? (
                                    <img 
                                      src={doc.data} 
                                      alt={doc.nombre}
                                      className="w-12 h-12 object-cover rounded border-2 border-blue-200 cursor-pointer hover:scale-110 transition"
                                      onClick={() => window.open(doc.data, '_blank')}
                                      title={doc.nombre}
                                    />
                                  ) : doc.tipo?.startsWith('video/') ? (
                                    <div className="w-12 h-12 bg-purple-100 rounded border-2 border-purple-200 flex items-center justify-center">
                                      <Video className="w-6 h-6 text-purple-600" />
                                    </div>
                                  ) : (
                                    <div className="w-12 h-12 bg-gray-100 rounded border-2 border-gray-200 flex items-center justify-center">
                                      <File className="w-6 h-6 text-gray-600" />
                                    </div>
                                  )}
                                </div>
                              ))}
                              {JSON.parse(tramite.documentos_adjuntos || '[]').length > 3 && (
                                <div className="w-12 h-12 bg-gray-100 rounded border-2 border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                  +{JSON.parse(tramite.documentos_adjuntos || '[]').length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-col gap-3 lg:items-end">
                    {/* Estado */}
                    {getEstadoBadge(tramite.estado)}

                    {/* Prioridad */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Prioridad:</span>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          tramite.prioridad >= 8 ? 'bg-red-500' :
                          tramite.prioridad >= 5 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        <span className={`font-bold ${
                          tramite.prioridad >= 8 ? 'text-red-600' :
                          tramite.prioridad >= 5 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {tramite.prioridad}/10
                        </span>
                      </div>
                    </div>

                    {/* Fecha */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(tramite.fecha_solicitud).toLocaleDateString('es-PE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    {/* Días transcurridos */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        {Math.floor((new Date() - new Date(tramite.fecha_solicitud)) / (1000 * 60 * 60 * 24))} días
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botón de acción */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => abrirModal(tramite)}
                    className="w-full sm:w-auto px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Responder / Ver Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Respuesta */}
      {showModal && tramiteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Responder Trámite</h2>
              <p className="text-gray-600 mt-1">{tramiteSeleccionado.codigo_tramite}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Info del Trámite */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Ciudadano:</span>
                    <p className="text-gray-900">{tramiteSeleccionado.usuario_nombre}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">DNI:</span>
                    <p className="text-gray-900">{tramiteSeleccionado.usuario_dni}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Email:</span>
                    <p className="text-gray-900">{tramiteSeleccionado.usuario_email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Teléfono:</span>
                    <p className="text-gray-900">{tramiteSeleccionado.usuario_telefono}</p>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Tipo de Trámite:</span>
                  <p className="text-gray-900">{tramiteSeleccionado.tipo_nombre}</p>
                </div>
                {tramiteSeleccionado.descripcion && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Descripción del Ciudadano:</span>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-2">
                      <div className="markdown-content prose prose-sm max-w-none">
                        <ReactMarkdown>{tramiteSeleccionado.descripcion}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Archivos Adjuntos */}
              {tramiteSeleccionado.documentos_adjuntos && JSON.parse(tramiteSeleccionado.documentos_adjuntos || '[]').length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Archivos Adjuntos ({JSON.parse(tramiteSeleccionado.documentos_adjuntos || '[]').length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {JSON.parse(tramiteSeleccionado.documentos_adjuntos || '[]').map((doc, idx) => (
                      <div key={idx} className="bg-white border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0">
                            {doc.tipo?.startsWith('image/') ? (
                              <Image className="w-5 h-5 text-blue-600" />
                            ) : doc.tipo?.startsWith('video/') ? (
                              <Video className="w-5 h-5 text-purple-600" />
                            ) : (
                              <File className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">{doc.nombre}</p>
                            <p className="text-xs text-gray-500">{(doc.tamaño / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        
                        {/* Vista previa para imágenes */}
                        {doc.tipo?.startsWith('image/') && (
                          <div className="mt-2">
                            <img 
                              src={doc.data} 
                              alt={doc.nombre}
                              className="w-full h-24 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-75 transition"
                              onClick={() => window.open(doc.data, '_blank')}
                            />
                          </div>
                        )}
                        
                        {/* Vista previa para videos */}
                        {doc.tipo?.startsWith('video/') && (
                          <div className="mt-2">
                            <video 
                              src={doc.data} 
                              controls
                              className="w-full h-24 rounded border border-gray-200"
                            />
                          </div>
                        )}
                        
                        {/* Botón de descarga */}
                        <a
                          href={doc.data}
                          download={doc.nombre}
                          className="mt-2 flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <Download className="w-3 h-3" />
                          Descargar
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleResponder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nuevo Estado *
                  </label>
                  <select
                    value={nuevoEstado}
                    onChange={(e) => setNuevoEstado(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_revision">En Revisión</option>
                    <option value="observado">Observado (requiere correcciones)</option>
                    <option value="aprobado">Aprobado</option>
                    <option value="rechazado">Rechazado</option>
                    <option value="completado">Completado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Respuesta/Observaciones
                  </label>
                  <textarea
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Escribe tu respuesta o comentarios para el ciudadano..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Esta respuesta será visible para el ciudadano y se enviará una notificación.
                  </p>
                </div>

                {/* Adjuntar archivos del admin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adjuntar Archivos (Opcional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      id="admin-files"
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="admin-files"
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Click para subir archivos</span>
                      <span className="text-xs text-gray-500">Imágenes, videos o documentos (máx. 5)</span>
                    </label>
                  </div>
                  
                  {archivosAdmin.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {archivosAdmin.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <File className="w-4 h-4 text-gray-600" />
                          <span className="text-sm flex-1 truncate">{file.name}</span>
                          <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botones de exportación */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exportar Trámite
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => exportarTramite(tramiteSeleccionado.id, 'pdf')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                    >
                      <FileDown className="w-4 h-4" />
                      Descargar PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => exportarTramite(tramiteSeleccionado.id, 'docx')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition"
                    >
                      <Download className="w-4 h-4" />
                      Descargar DOCX
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="submit"
                    disabled={loadingRespuesta}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    {loadingRespuesta ? 'Actualizando...' : 'Guardar y Notificar'}
                  </button>
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
