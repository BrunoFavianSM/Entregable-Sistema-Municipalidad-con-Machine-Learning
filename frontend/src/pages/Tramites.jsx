import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { Link } from 'react-router-dom'
import { 
  FileText, Search, DollarSign, Home, Building, FileCheck, 
  AlertTriangle, Users, Car, Lightbulb, HelpCircle,
  ChevronRight, Clock, TrendingUp
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function Tramites() {
  const [tiposTramite, setTiposTramite] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas')

  useEffect(() => {
    loadTiposTramite()
  }, [])

  const loadTiposTramite = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/tramites/tipos')
      setTiposTramite(response.data.tipos_tramite)
    } catch (error) {
      console.error('Error cargando tipos de trámite:', error)
      toast.error('Error al cargar tipos de trámite')
    } finally {
      setLoading(false)
    }
  }

  const categorias = [
    { id: 'todas', nombre: 'Todas las Categorías', icono: FileText, color: 'gray' },
    { id: 'impuestos_pagos', nombre: 'Impuestos y Pagos', icono: DollarSign, color: 'green' },
    { id: 'catastro_propiedad', nombre: 'Catastro y Propiedad', icono: Home, color: 'blue' },
    { id: 'licencias', nombre: 'Licencias', icono: FileCheck, color: 'purple' },
    { id: 'obras_construccion', nombre: 'Obras y Construcción', icono: Building, color: 'orange' },
    { id: 'quejas_denuncias', nombre: 'Quejas y Denuncias', icono: AlertTriangle, color: 'red' },
    { id: 'registro_civil', nombre: 'Registro Civil', icono: Users, color: 'indigo' },
    { id: 'transporte_transito', nombre: 'Transporte y Tránsito', icono: Car, color: 'yellow' },
    { id: 'servicios_municipales', nombre: 'Servicios Municipales', icono: Lightbulb, color: 'teal' },
    { id: 'atencion_ciudadano', nombre: 'Atención al Ciudadano', icono: HelpCircle, color: 'pink' }
  ]

  const getColorClasses = (color) => {
    const colors = {
      gray: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200',
      green: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
      blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      purple: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
      orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
      red: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
      teal: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
      pink: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100'
    }
    return colors[color] || colors.gray
  }

  const tramitesFiltrados = tiposTramite.filter(tramite => {
    const cumpleBusqueda = busqueda === '' ||
      tramite.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      tramite.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
    
    const cumpleCategoria = categoriaSeleccionada === 'todas' ||
      tramite.categoria === categoriaSeleccionada
    
    return cumpleBusqueda && cumpleCategoria
  })

  const tramitesPorCategoria = categorias.reduce((acc, cat) => {
    if (cat.id === 'todas') return acc
    acc[cat.id] = tramitesFiltrados.filter(t => t.categoria === cat.id)
    return acc
  }, {})

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando tipos de trámite...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">Tipos de Trámites</h1>
          <p className="text-blue-100 text-lg">
            Explora {tiposTramite.length} trámites disponibles en 9 categorías
          </p>
        </div>

        {/* Barra de Búsqueda */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar trámite por nombre o descripción..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtros de Categoría */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categorias.map((cat) => {
            const IconComponent = cat.icono
            const isActive = categoriaSeleccionada === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setCategoriaSeleccionada(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 whitespace-nowrap transition ${
                  isActive 
                    ? `${getColorClasses(cat.color)} border-current font-semibold` 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-sm">{cat.nombre}</span>
              </button>
            )
          })}
        </div>

        {/* Vista por Categorías */}
        {categoriaSeleccionada === 'todas' ? (
          <div className="space-y-10">
            {categorias.slice(1).map((cat) => {
              const tramitesCategoria = tramitesPorCategoria[cat.id]
              if (!tramitesCategoria || tramitesCategoria.length === 0) return null
              
              const IconComponent = cat.icono
              return (
                <div key={cat.id} className="space-y-5">
                  {/* Header de Categoría Mejorado */}
                  <div className={`rounded-2xl p-6 ${getColorClasses(cat.color)} border-2`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-xl shadow-md flex items-center justify-center">
                          <IconComponent className="w-8 h-8" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">{cat.nombre}</h2>
                          <p className="text-sm opacity-80">{tramitesCategoria.length} trámite(s) disponible(s)</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setCategoriaSeleccionada(cat.id)}
                        className="px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition font-medium text-sm"
                      >
                        Ver todos →
                      </button>
                    </div>
                  </div>
                  
                  {/* Grid de Trámites Mejorado */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {tramitesCategoria.map((tramite) => (
                      <Link
                        key={tramite.id}
                        to="/nuevo-tramite"
                        state={{ tipoTramite: tramite }}
                        className="bg-white rounded-2xl shadow-md border-2 border-gray-100 p-6 hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 group"
                      >
                        {/* Código del trámite */}
                        <div className="text-xs font-mono text-gray-400 mb-3">
                          {tramite.codigo}
                        </div>
                        
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition flex-1 leading-tight">
                            {tramite.nombre}
                          </h3>
                          <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-5 line-clamp-3 min-h-[60px]">
                          {tramite.descripcion}
                        </p>
                        
                        {/* Info inferior mejorada */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">{tramite.tiempo_estimado_dias} días</span>
                          </div>
                          <div className="px-3 py-1 bg-green-50 rounded-lg">
                            <span className="text-sm font-bold text-green-700">
                              S/ {Number(tramite.costo).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Vista de Categoría Individual */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tramitesFiltrados.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl shadow-lg border border-gray-200 p-16 text-center">
                <FileText className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No se encontraron trámites
                </h3>
                <p className="text-gray-600 mb-6">
                  Intenta con otra búsqueda o categoría
                </p>
                <button
                  onClick={() => {
                    setCategoriaSeleccionada('todas')
                    setBusqueda('')
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Ver todos los trámites
                </button>
              </div>
            ) : (
              tramitesFiltrados.map((tramite) => (
                <Link
                  key={tramite.id}
                  to="/nuevo-tramite"
                  state={{ tipoTramite: tramite }}
                  className="bg-white rounded-2xl shadow-md border-2 border-gray-100 p-6 hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 group"
                >
                  {/* Código del trámite */}
                  <div className="text-xs font-mono text-gray-400 mb-3">
                    {tramite.codigo}
                  </div>
                  
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition flex-1 leading-tight">
                      {tramite.nombre}
                    </h3>
                    <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-5 line-clamp-3 min-h-[60px]">
                    {tramite.descripcion}
                  </p>
                  
                  {/* Info inferior mejorada */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">{tramite.tiempo_estimado_dias} días</span>
                    </div>
                    <div className="px-3 py-1 bg-green-50 rounded-lg">
                      <span className="text-sm font-bold text-green-700">
                        S/ {Number(tramite.costo).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
