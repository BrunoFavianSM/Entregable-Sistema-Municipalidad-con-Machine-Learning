import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import { Link, Navigate } from 'react-router-dom'
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  PlusCircle,
  Bot,
  Bell,
  Star
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [tramites, setTramites] = useState([])
  const [notificaciones, setNotificaciones] = useState([])
  const [loading, setLoading] = useState(true)

  // Redirigir administradores a su panel
  if (user && user.tipo_usuario === 'administrador') {
    return <Navigate to="/admin" replace />
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Cargar estadísticas
      try {
        const statsRes = await axios.get('/api/dashboard/stats')
        setStats(statsRes.data)
      } catch (err) {
        console.error('Error cargando stats:', err)
        setStats({ total_tramites: 0, tiempo_promedio_dias: 0, tramites_por_estado: [] })
      }
      
      // Cargar mis trámites recientes
      try {
        const tramitesRes = await axios.get('/api/tramites/mis-tramites')
        setTramites(tramitesRes.data.tramites?.slice(0, 5) || [])
      } catch (err) {
        console.error('Error cargando trámites:', err)
        setTramites([])
      }
      
      // Cargar notificaciones no leídas
      try {
        const notifsRes = await axios.get('/api/notificaciones?no_leidas=true')
        setNotificaciones(notifsRes.data.notificaciones?.slice(0, 5) || [])
      } catch (err) {
        console.error('Error cargando notificaciones:', err)
        setNotificaciones([])
      }
      
    } catch (error) {
      console.error('Error cargando dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEstadoColor = (estado) => {
    const colors = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'en_revision': 'bg-blue-100 text-blue-800',
      'observado': 'bg-orange-100 text-orange-800',
      'aprobado': 'bg-green-100 text-green-800',
      'rechazado': 'bg-red-100 text-red-800',
      'finalizado': 'bg-gray-100 text-gray-800'
    }
    return colors[estado] || 'bg-gray-100 text-gray-800'
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando dashboard...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">
            ¡Bienvenido, {user?.nombres}!
          </h1>
          <p className="text-gray-600 mt-1">
            Aquí está el resumen de tus trámites y actividad
          </p>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Trámites</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.total_tramites || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En Proceso</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {stats?.tramites_por_estado?.find(t => t.estado === 'pendiente')?.cantidad || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Finalizados</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats?.tramites_por_estado?.find(t => t.estado === 'finalizado')?.cantidad || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tiempo Promedio</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats?.tiempo_promedio_dias || 0}
                  <span className="text-sm text-gray-600 ml-1">días</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/tramites/nuevo"
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Nuevo Trámite</h3>
                <p className="text-sm text-blue-100">Iniciar un nuevo trámite</p>
              </div>
            </div>
          </Link>

          <Link
            to="/asistente-ia"
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Asistente IA</h3>
                <p className="text-sm text-purple-100">Consulta con Gemini</p>
              </div>
            </div>
          </Link>

          <Link
            to="/notificaciones"
            className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center relative">
                <Bell className="w-6 h-6" />
                {notificaciones.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                    {notificaciones.length}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg">Notificaciones</h3>
                <p className="text-sm text-green-100">
                  {notificaciones.length} sin leer
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/calificar-alcalde"
            className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Calificar Alcalde</h3>
                <p className="text-sm text-yellow-100">
                  Tu opinión cuenta
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Trámites recientes y notificaciones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trámites recientes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Trámites Recientes
                </h2>
                <Link
                  to="/mis-tramites"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ver todos →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {tramites.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No tienes trámites aún</p>
                  <Link
                    to="/tramites/nuevo"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
                  >
                    Crear tu primer trámite
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {tramites.map((tramite) => (
                    <div
                      key={tramite.id}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {tramite.tipo_tramite_nombre}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Código: {tramite.codigo_tramite}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(tramite.fecha_solicitud).toLocaleDateString('es-PE')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(tramite.estado)}`}>
                          {getEstadoTexto(tramite.estado)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notificaciones recientes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Notificaciones
                </h2>
                <Link
                  to="/notificaciones"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ver todas →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {notificaciones.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No tienes notificaciones nuevas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notificaciones.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-4 bg-blue-50 rounded-lg border border-blue-100"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notif.tipo === 'exito' ? 'bg-green-500' :
                          notif.tipo === 'alerta' ? 'bg-yellow-500' :
                          notif.tipo === 'error' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">
                            {notif.titulo}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notif.mensaje}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notif.fecha_creacion).toLocaleString('es-PE')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
