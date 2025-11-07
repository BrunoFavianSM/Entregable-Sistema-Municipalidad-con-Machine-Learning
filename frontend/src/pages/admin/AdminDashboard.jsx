import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { 
  Users, FileText, Clock, CheckCircle, XCircle, AlertCircle,
  TrendingUp, BarChart3, Activity, LogOut, Bot, Star, UserCog, Moon, Sun
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [tramitesRecientes, setTramitesRecientes] = useState([])
  const [calificaciones, setCalificaciones] = useState(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  // Redirigir si no es administrador
  if (user && user.tipo_usuario !== 'administrador') {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    // Aplicar/remover clase dark del documento
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const cargarDatos = async () => {
    try {
      setLoading(true)
      
      // Obtener estadísticas
      const statsRes = await axios.get('/api/admin/estadisticas')
      setStats(statsRes.data.estadisticas)

      // Obtener trámites recientes pendientes
      const tramitesRes = await axios.get('/api/admin/tramites?estado=pendiente')
      setTramitesRecientes(tramitesRes.data.tramites.slice(0, 5))

      // Obtener calificaciones
      const calificacionesRes = await axios.get('/api/calificaciones/estadisticas')
      setCalificaciones(calificacionesRes.data.estadisticas)
      
    } catch (error) {
      toast.error('Error al cargar datos del panel')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${estilos[estado] || 'bg-gray-100 text-gray-800'}`}>
        {estado.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Panel de Administrador
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Bienvenido, {user?.nombres} {user?.apellidos}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                title={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700" />
                )}
              </button>
              <Link
                to="/admin/tramites"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Ver Todos los Trámites
              </Link>
              <Link
                to="/admin/ia"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <Bot className="w-4 h-4" />
                Asistente IA
              </Link>
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
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Usuarios */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Ciudadanos</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats?.total_ciudadanos || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Trámites Hoy */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Trámites Hoy</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats?.tramites_hoy || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* Trámites Pendientes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                  {stats?.tramites_por_estado?.find(t => t.estado === 'pendiente')?.cantidad || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Tiempo Promedio */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tiempo Promedio</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats?.tiempo_promedio_dias || 0} <span className="text-lg">días</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* Calificación Ciudadana */}
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-90">Calificación Ciudadana</p>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-4xl font-bold">
                    {calificaciones?.promedio ? calificaciones.promedio.toFixed(1) : '0.0'}
                  </p>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.round(calificaciones?.promedio || 0)
                            ? 'fill-white text-white'
                            : 'text-white opacity-30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm opacity-90 mt-2">
                  {calificaciones?.total_calificaciones || 0} calificaciones
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de Estados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Trámites por Estado
            </h2>
            <div className="space-y-3">
              {stats?.tramites_por_estado?.map((item) => (
                <div key={item.estado} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getEstadoBadge(item.estado)}
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {item.estado.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{item.cantidad}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trámites Recientes Pendientes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Trámites Pendientes Recientes
            </h2>
            <div className="space-y-3">
              {tramitesRecientes.length > 0 ? (
                tramitesRecientes.map((tramite) => (
                  <div key={tramite.id} className="border-l-4 border-yellow-500 pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">{tramite.codigo_tramite}</span>
                      <span className="text-xs text-gray-500">
                        Prioridad: {tramite.prioridad}/10
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{tramite.tipo_nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {tramite.usuario_nombre} - {new Date(tramite.fecha_solicitud).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No hay trámites pendientes</p>
              )}
            </div>
            {tramitesRecientes.length > 0 && (
              <Link
                to="/admin/tramites"
                className="block text-center mt-4 text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                Ver todos los trámites →
              </Link>
            )}
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/admin/tramites?estado=pendiente"
              className="flex items-center gap-3 p-4 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition"
            >
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Revisar Pendientes</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Atender solicitudes nuevas</p>
              </div>
            </Link>

            <Link
              to="/admin/tramites?estado=en_revision"
              className="flex items-center gap-3 p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
            >
              <AlertCircle className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">En Revisión</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Continuar evaluación</p>
              </div>
            </Link>

            <Link
              to="/admin/perfil"
              className="flex items-center gap-3 p-4 border-2 border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
            >
              <UserCog className="w-8 h-8 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Mi Perfil</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Configuración y seguridad</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
