import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { Bell, Check, Trash2 } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todas') // 'todas' | 'no_leidas'

  useEffect(() => {
    loadNotificaciones()
  }, [filter])

  const loadNotificaciones = async () => {
    try {
      setLoading(true)
      const url = filter === 'no_leidas' 
        ? '/api/notificaciones?no_leidas=true'
        : '/api/notificaciones'
      
      const response = await axios.get(url)
      setNotificaciones(response.data.notificaciones || [])
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
      setNotificaciones([])
    } finally {
      setLoading(false)
    }
  }

  const marcarComoLeida = async (id) => {
    try {
      await axios.put(`/api/notificaciones/${id}/leer`)
      setNotificaciones(prev =>
        prev.map(n => n.id === id ? { ...n, leida: true } : n)
      )
      toast.success('Notificación marcada como leída')
    } catch (error) {
      console.error('Error marcando notificación:', error)
      toast.error('Error al marcar notificación')
    }
  }

  const getTipoIcon = (tipo) => {
    const icons = {
      'exito': '✅',
      'info': 'ℹ️',
      'alerta': '⚠️',
      'error': '❌'
    }
    return icons[tipo] || 'ℹ️'
  }

  const getTipoColor = (tipo) => {
    const colors = {
      'exito': 'bg-green-50 border-green-200',
      'info': 'bg-blue-50 border-blue-200',
      'alerta': 'bg-yellow-50 border-yellow-200',
      'error': 'bg-red-50 border-red-200'
    }
    return colors[tipo] || 'bg-gray-50 border-gray-200'
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando notificaciones...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notificaciones</h1>
            <p className="text-gray-600 mt-1">
              {notificaciones.filter(n => !n.leida).length} notificaciones sin leer
            </p>
          </div>

          {/* Filtros */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('todas')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'todas'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('no_leidas')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'no_leidas'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              No leídas
            </button>
          </div>
        </div>

        {/* Lista de notificaciones */}
        {notificaciones.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay notificaciones
            </h3>
            <p className="text-gray-600">
              {filter === 'no_leidas'
                ? 'No tienes notificaciones sin leer'
                : 'Aún no tienes notificaciones'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notificaciones.map((notif) => (
              <div
                key={notif.id}
                className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all ${
                  notif.leida
                    ? 'border-gray-200 opacity-75'
                    : 'border-blue-300 shadow-md'
                } ${getTipoColor(notif.tipo)}`}
              >
                <div className="flex items-start gap-4">
                  {/* Icono */}
                  <div className="text-2xl flex-shrink-0">
                    {getTipoIcon(notif.tipo)}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">
                          {notif.titulo}
                        </h3>
                        <p className="text-gray-700 mb-2">
                          {notif.mensaje}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(notif.fecha_creacion).toLocaleString('es-PE', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      {/* Acciones */}
                      {!notif.leida && (
                        <button
                          onClick={() => marcarComoLeida(notif.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Marcar leída
                        </button>
                      )}
                    </div>

                    {/* Badge de leída */}
                    {notif.leida && (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs">
                          <Check className="w-3 h-3" />
                          Leída
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
