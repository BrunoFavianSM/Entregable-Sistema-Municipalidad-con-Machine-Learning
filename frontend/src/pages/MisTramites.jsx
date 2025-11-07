import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import ReactMarkdown from 'react-markdown'
import { Search, Filter, FileText, Calendar, Clock, Download, Eye, X, FileDown, Image, Video, File } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function MisTramites() {
  const [tramites, setTramites] = useState([])
  const [filteredTramites, setFilteredTramites] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('todos')
  const [tramiteSeleccionado, setTramiteSeleccionado] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadTramites()
  }, [])

  useEffect(() => {
    filterTramites()
  }, [searchTerm, estadoFilter, tramites])

  const loadTramites = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/tramites/mis-tramites')
      setTramites(response.data.tramites || [])
    } catch (error) {
      console.error('Error cargando trámites:', error)
      setTramites([])
    } finally {
      setLoading(false)
    }
  }

  const filterTramites = () => {
    let filtered = [...tramites]

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.codigo_tramite.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tipo_tramite_nombre.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por estado
    if (estadoFilter !== 'todos') {
      filtered = filtered.filter(t => t.estado === estadoFilter)
    }

    setFilteredTramites(filtered)
  }

  const getEstadoColor = (estado) => {
    const colors = {
      'pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'en_revision': 'bg-blue-100 text-blue-800 border-blue-200',
      'observado': 'bg-orange-100 text-orange-800 border-orange-200',
      'aprobado': 'bg-green-100 text-green-800 border-green-200',
      'rechazado': 'bg-red-100 text-red-800 border-red-200',
      'finalizado': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[estado] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getEstadoTexto = (estado) => {
    const textos = {
      'pendiente': 'Pendiente',
      'en_revision': 'En Revisión',
      'observado': 'Observado',
      'aprobado': 'Aprobado',
      'rechazado': 'Rechazado',
      'finalizado': 'Finalizado'
    }
    return textos[estado] || estado
  }

  const getPrioridadColor = (prioridad) => {
    if (prioridad >= 8) return 'text-red-600'
    if (prioridad >= 5) return 'text-yellow-600'
    return 'text-green-600'
  }

  const verDetalles = (tramite) => {
    setTramiteSeleccionado(tramite)
    setShowModal(true)
  }

  const cerrarModal = () => {
    setShowModal(false)
    setTramiteSeleccionado(null)
  }

  const exportarTramite = async (tramiteId, formato) => {
    try {
      toast.loading(`Generando ${formato.toUpperCase()}...`)
      
      const response = await axios.get(`/api/tramites/${tramiteId}/exportar/${formato}`, {
        responseType: 'blob'
      })
      
      // Crear link de descarga
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando trámites...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Trámites</h1>
          <p className="text-gray-600 mt-1">
            Gestiona y da seguimiento a todos tus trámites
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por código o tipo de trámite..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtro por estado */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_revision">En Revisión</option>
                <option value="observado">Observado</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
                <option value="finalizado">Finalizado</option>
              </select>
            </div>
          </div>

          {/* Contador */}
          <div className="mt-4 text-sm text-gray-600">
            Mostrando {filteredTramites.length} de {tramites.length} trámites
          </div>
        </div>

        {/* Lista de trámites */}
        {filteredTramites.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron trámites
            </h3>
            <p className="text-gray-600">
              {searchTerm || estadoFilter !== 'todos'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Aún no tienes trámites registrados'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTramites.map((tramite) => (
              <div
                key={tramite.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Información principal */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">
                          {tramite.tipo_tramite_nombre}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Código: <span className="font-mono font-medium">{tramite.codigo_tramite}</span>
                        </p>
                        {tramite.descripcion && (
                          <p className="text-sm text-gray-600 mt-2">
                            {tramite.descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-col gap-3 lg:items-end">
                    {/* Estado */}
                    <span className={`px-4 py-2 rounded-lg text-sm font-medium border ${getEstadoColor(tramite.estado)}`}>
                      {getEstadoTexto(tramite.estado)}
                    </span>

                    {/* Prioridad */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Prioridad:</span>
                      <span className={`font-bold ${getPrioridadColor(tramite.prioridad)}`}>
                        {tramite.prioridad}/10
                      </span>
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

                {/* Botones de acción */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => verDetalles(tramite)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Completo
                  </button>
                  
                  <button
                    onClick={() => exportarTramite(tramite.id, 'pdf')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium"
                  >
                    <FileDown className="w-4 h-4" />
                    Descargar PDF
                  </button>
                  
                  <button
                    onClick={() => exportarTramite(tramite.id, 'docx')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Descargar DOCX
                  </button>
                </div>

                {/* Observaciones */}
                {tramite.observaciones && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800 mb-1">
                      Observaciones:
                    </p>
                    <p className="text-sm text-yellow-700">
                      {tramite.observaciones}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {showModal && tramiteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Detalles del Trámite
              </h2>
              <button
                onClick={cerrarModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-6">
              {/* Información Principal */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-blue-900 mb-3">
                  {tramiteSeleccionado.tipo_tramite_nombre}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Código:</span>
                    <span className="ml-2 font-mono font-bold">{tramiteSeleccionado.codigo_tramite}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Estado:</span>
                    <span className={`ml-2 px-3 py-1 rounded-lg text-xs font-medium ${getEstadoColor(tramiteSeleccionado.estado)}`}>
                      {getEstadoTexto(tramiteSeleccionado.estado)}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Fecha:</span>
                    <span className="ml-2">{new Date(tramiteSeleccionado.fecha_solicitud).toLocaleDateString('es-PE')}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Prioridad:</span>
                    <span className={`ml-2 font-bold ${getPrioridadColor(tramiteSeleccionado.prioridad)}`}>
                      {tramiteSeleccionado.prioridad}/10
                    </span>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              {tramiteSeleccionado.descripcion && (
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3">Descripción de la Solicitud</h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="markdown-content prose prose-sm max-w-none">
                      <ReactMarkdown>{tramiteSeleccionado.descripcion}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              {/* Respuesta del Admin */}
              {tramiteSeleccionado.respuesta_admin && (
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3">Respuesta de la Municipalidad</h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="markdown-content prose prose-sm max-w-none">
                      <ReactMarkdown>{tramiteSeleccionado.respuesta_admin}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              {/* Observaciones */}
              {tramiteSeleccionado.observaciones && (
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3">Observaciones</h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-900">{tramiteSeleccionado.observaciones}</p>
                  </div>
                </div>
              )}

              {/* Archivos Adjuntos */}
              {tramiteSeleccionado.documentos_adjuntos && JSON.parse(tramiteSeleccionado.documentos_adjuntos || '[]').length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3">📎 Archivos Adjuntos</h4>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {JSON.parse(tramiteSeleccionado.documentos_adjuntos || '[]').map((doc, idx) => (
                        <div key={idx} className="bg-white border border-purple-200 rounded-lg p-3 hover:shadow-md transition">
                          <div className="flex items-start gap-2 mb-2">
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
                              <p className="text-sm font-medium text-gray-900 truncate">{doc.nombre}</p>
                              <p className="text-xs text-gray-500">{(doc.tamaño / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          
                          {/* Preview de imagen */}
                          {doc.tipo?.startsWith('image/') && (
                            <div className="mb-2">
                              <img 
                                src={doc.data} 
                                alt={doc.nombre}
                                className="w-full h-32 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-75 transition"
                                onClick={() => window.open(doc.data, '_blank')}
                                title="Click para ver en tamaño completo"
                              />
                            </div>
                          )}
                          
                          {/* Preview de video */}
                          {doc.tipo?.startsWith('video/') && (
                            <div className="mb-2">
                              <video 
                                src={doc.data} 
                                controls
                                className="w-full h-32 rounded border border-gray-200"
                              />
                            </div>
                          )}
                          
                          {/* Botón de descarga */}
                          <a
                            href={doc.data}
                            download={doc.nombre}
                            className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium text-sm"
                          >
                            <Download className="w-4 h-4" />
                            Descargar
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Archivos del Admin (Respuesta) */}
              {tramiteSeleccionado.documentos_admin && JSON.parse(tramiteSeleccionado.documentos_admin || '[]').length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3">📎 Archivos de la Municipalidad</h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {JSON.parse(tramiteSeleccionado.documentos_admin || '[]').map((doc, idx) => (
                        <div key={idx} className="bg-white border border-green-200 rounded-lg p-3 hover:shadow-md transition">
                          <div className="flex items-start gap-2 mb-2">
                            <div className="flex-shrink-0">
                              {doc.tipo?.startsWith('image/') ? (
                                <Image className="w-5 h-5 text-green-600" />
                              ) : doc.tipo?.startsWith('video/') ? (
                                <Video className="w-5 h-5 text-green-600" />
                              ) : (
                                <File className="w-5 h-5 text-green-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{doc.nombre}</p>
                              <p className="text-xs text-gray-500">{(doc.tamaño / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          
                          {/* Preview de imagen */}
                          {doc.tipo?.startsWith('image/') && (
                            <div className="mb-2">
                              <img 
                                src={doc.data} 
                                alt={doc.nombre}
                                className="w-full h-32 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-75 transition"
                                onClick={() => window.open(doc.data, '_blank')}
                                title="Click para ver en tamaño completo"
                              />
                            </div>
                          )}
                          
                          {/* Preview de video */}
                          {doc.tipo?.startsWith('video/') && (
                            <div className="mb-2">
                              <video 
                                src={doc.data} 
                                controls
                                className="w-full h-32 rounded border border-gray-200"
                              />
                            </div>
                          )}
                          
                          {/* Botón de descarga */}
                          <a
                            href={doc.data}
                            download={doc.nombre}
                            className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition font-medium text-sm"
                          >
                            <Download className="w-4 h-4" />
                            Descargar
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de Exportación */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    exportarTramite(tramiteSeleccionado.id, 'pdf')
                    cerrarModal()
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium"
                >
                  <FileDown className="w-5 h-5" />
                  Descargar PDF
                </button>
                <button
                  onClick={() => {
                    exportarTramite(tramiteSeleccionado.id, 'docx')
                    cerrarModal()
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition font-medium"
                >
                  <Download className="w-5 h-5" />
                  Descargar DOCX
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
