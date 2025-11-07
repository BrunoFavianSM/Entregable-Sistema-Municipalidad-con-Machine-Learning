import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [vistaActual, setVistaActual] = useState('dashboard');
  const [estadisticas, setEstadisticas] = useState(null);
  const [tramites, setTramites] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [filtros, setFiltros] = useState({ estado: '', categoria: '' });
  const [tramiteSeleccionado, setTramiteSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar que sea administrador
  useEffect(() => {
    if (!user || user.tipo_usuario !== 'administrador') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Cargar datos
  useEffect(() => {
    if (vistaActual === 'dashboard') {
      cargarEstadisticas();
    } else if (vistaActual === 'tramites') {
      cargarTramites();
    } else if (vistaActual === 'usuarios') {
      cargarUsuarios();
    }
  }, [vistaActual, filtros]);

  const cargarEstadisticas = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/estadisticas', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setEstadisticas(data);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarTramites = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.categoria) params.append('categoria', filtros.categoria);

      const response = await fetch(`http://localhost:5000/api/admin/tramites?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setTramites(data.tramites || []);
    } catch (err) {
      console.error('Error cargando trámites:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/admin/usuarios', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setUsuarios(data.usuarios || []);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const actualizarEstadoTramite = async (tramiteId, nuevoEstado, comentario) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/tramites/${tramiteId}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          estado: nuevoEstado,
          comentario
        })
      });

      const data = await response.json();
      
      if (data.success) {
        cargarTramites();
        setTramiteSeleccionado(null);
        alert('Estado actualizado correctamente');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error('Error actualizando estado:', err);
      alert('Error al actualizar el estado');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Admin */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Panel de Administración</h1>
              <p className="text-purple-100 mt-1">Municipalidad Provincial de Yau</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
            >
              ← Volver al Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Navegación de Pestañas */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            <button
              onClick={() => setVistaActual('dashboard')}
              className={`px-6 py-4 font-medium transition ${
                vistaActual === 'dashboard'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setVistaActual('tramites')}
              className={`px-6 py-4 font-medium transition ${
                vistaActual === 'tramites'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Trámites
            </button>
            <button
              onClick={() => setVistaActual('usuarios')}
              className={`px-6 py-4 font-medium transition ${
                vistaActual === 'usuarios'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👥 Usuarios
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Cargando...</p>
          </div>
        ) : (
          <>
            {/* Vista Dashboard */}
            {vistaActual === 'dashboard' && estadisticas && (
              <DashboardAdmin estadisticas={estadisticas} />
            )}

            {/* Vista Trámites */}
            {vistaActual === 'tramites' && (
              <TramitesAdmin
                tramites={tramites}
                filtros={filtros}
                setFiltros={setFiltros}
                tramiteSeleccionado={tramiteSeleccionado}
                setTramiteSeleccionado={setTramiteSeleccionado}
                actualizarEstadoTramite={actualizarEstadoTramite}
              />
            )}

            {/* Vista Usuarios */}
            {vistaActual === 'usuarios' && (
              <UsuariosAdmin usuarios={usuarios} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Componente Dashboard Admin
function DashboardAdmin({ estadisticas }) {
  return (
    <div className="space-y-6">
      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Usuarios</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.total_usuarios || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
              <span className="text-2xl">📋</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Trámites</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.total_tramites || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
              <span className="text-2xl">⏱️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.tiempo_promedio_dias || 0} días</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
              <span className="text-2xl">📅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Este Mes</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.tramites_mes || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos y Tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trámites por Estado */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Trámites por Estado</h3>
          {estadisticas.tramites_por_estado && estadisticas.tramites_por_estado.map((item) => (
            <div key={item.estado} className="flex items-center justify-between py-2">
              <span className="text-gray-700 capitalize">{item.estado.replace('_', ' ')}</span>
              <span className="font-bold text-gray-900">{item.cantidad}</span>
            </div>
          ))}
        </div>

        {/* Trámites por Categoría */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Trámites por Categoría</h3>
          {estadisticas.tramites_por_categoria && estadisticas.tramites_por_categoria.slice(0, 5).map((item) => (
            <div key={item.categoria} className="flex items-center justify-between py-2">
              <span className="text-gray-700 capitalize">{item.categoria.replace('_', ' ')}</span>
              <span className="font-bold text-gray-900">{item.cantidad}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Componente Trámites Admin
function TramitesAdmin({ tramites, filtros, setFiltros, tramiteSeleccionado, setTramiteSeleccionado, actualizarEstadoTramite }) {
  const [comentario, setComentario] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState('');

  const getEstadoColor = (estado) => {
    const colors = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'en_revision': 'bg-blue-100 text-blue-800',
      'observado': 'bg-orange-100 text-orange-800',
      'aprobado': 'bg-green-100 text-green-800',
      'rechazado': 'bg-red-100 text-red-800',
      'finalizado': 'bg-gray-100 text-gray-800'
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const handleActualizarEstado = () => {
    if (!nuevoEstado) {
      alert('Selecciona un estado');
      return;
    }
    actualizarEstadoTramite(tramiteSeleccionado.id, nuevoEstado, comentario);
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filtros.estado}
            onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_revision">En Revisión</option>
            <option value="observado">Observado</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
            <option value="finalizado">Finalizado</option>
          </select>

          <select
            value={filtros.categoria}
            onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Todas las categorías</option>
            <option value="impuestos_pagos">Impuestos y Pagos</option>
            <option value="licencias_autorizaciones">Licencias</option>
            <option value="obras_construccion">Obras</option>
            <option value="registro_civil">Registro Civil</option>
          </select>

          <button
            onClick={() => setFiltros({ estado: '', categoria: '' })}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Lista de Trámites */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ciudadano</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tramites.map((tramite) => (
                <tr key={tramite.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {tramite.codigo_tramite}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {tramite.ciudadano}
                    <br />
                    <span className="text-xs text-gray-500">{tramite.ciudadano_dni}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{tramite.tipo_tramite}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(tramite.estado)}`}>
                      {tramite.estado.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tramite.fecha_solicitud).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setTramiteSeleccionado(tramite)}
                      className="text-purple-600 hover:text-purple-900 font-medium"
                    >
                      Gestionar →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Gestión */}
      {tramiteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">Gestionar Trámite</h3>
              <button
                onClick={() => setTramiteSeleccionado(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Código:</strong> {tramiteSeleccionado.codigo_tramite}</p>
                <p><strong>Ciudadano:</strong> {tramiteSeleccionado.ciudadano}</p>
                <p><strong>DNI:</strong> {tramiteSeleccionado.ciudadano_dni}</p>
                <p><strong>Email:</strong> {tramiteSeleccionado.ciudadano_email}</p>
                <p><strong>Tipo:</strong> {tramiteSeleccionado.tipo_tramite}</p>
                <p><strong>Estado Actual:</strong> <span className={`px-2 py-1 rounded ${getEstadoColor(tramiteSeleccionado.estado)}`}>{tramiteSeleccionado.estado}</span></p>
                {tramiteSeleccionado.descripcion && (
                  <p><strong>Descripción:</strong> {tramiteSeleccionado.descripcion}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Nuevo Estado</label>
                <select
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">-- Selecciona --</option>
                  <option value="en_revision">En Revisión</option>
                  <option value="observado">Observado</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="rechazado">Rechazado</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Comentarios / Observaciones</label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Escribe comentarios sobre este trámite..."
                ></textarea>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleActualizarEstado}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700"
                >
                  Actualizar Estado
                </button>
                <button
                  onClick={() => setTramiteSeleccionado(null)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente Usuarios Admin
function UsuariosAdmin({ usuarios }) {
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DNI</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registro</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {usuario.dni}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {usuario.nombres} {usuario.apellidos}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {usuario.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                  {usuario.tipo_usuario}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    usuario.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(usuario.fecha_registro).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
