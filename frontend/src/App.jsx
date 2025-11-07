import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import axios from 'axios'

// Páginas
import Login from './pages/Login'
import Register from './pages/Register'
import RecuperarPassword from './pages/RecuperarPassword'
import Dashboard from './pages/Dashboard'
import Tramites from './pages/Tramites'
import NuevoTramite from './pages/NuevoTramite'
import MisTramites from './pages/MisTramites'
import Notificaciones from './pages/Notificaciones'
import AsistenteIA from './pages/AsistenteIA'
import Perfil from './pages/Perfil'
import CalificarAlcalde from './pages/CalificarAlcalde'

// Páginas de Administrador
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminTramites from './pages/admin/AdminTramites'
import AdminIA from './pages/admin/AdminIA'
import AdminPerfil from './pages/admin/AdminPerfil'

// Contextos
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

// Configurar axios
axios.defaults.baseURL = 'http://localhost:5000'

// Interceptor para agregar token automáticamente
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log(`📤 Enviando petición a ${config.url} con token`)
    } else {
      console.log(`📤 Enviando petición a ${config.url} SIN token`)
    }
    return config
  },
  (error) => {
    console.error('❌ Error en interceptor:', error)
    return Promise.reject(error)
  }
)

// Componente de ruta protegida
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

// Componente de ruta protegida solo para administradores
function ProtectedAdminRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (user.tipo_usuario !== 'administrador') {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function AppContent() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/recuperar-password" element={<RecuperarPassword />} />
          
          {/* Rutas protegidas */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tramites"
            element={
              <ProtectedRoute>
                <Tramites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tramites/nuevo"
            element={
              <ProtectedRoute>
                <NuevoTramite />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mis-tramites"
            element={
              <ProtectedRoute>
                <MisTramites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notificaciones"
            element={
              <ProtectedRoute>
                <Notificaciones />
              </ProtectedRoute>
            }
          />
          <Route
            path="/asistente-ia"
            element={
              <ProtectedRoute>
                <AsistenteIA />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calificar-alcalde"
            element={
              <ProtectedRoute>
                <CalificarAlcalde />
              </ProtectedRoute>
            }
          />

          {/* Rutas de Administrador */}
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/tramites"
            element={
              <ProtectedAdminRoute>
                <AdminTramites />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/ia"
            element={
              <ProtectedAdminRoute>
                <AdminIA />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/perfil"
            element={
              <ProtectedAdminRoute>
                <AdminPerfil />
              </ProtectedAdminRoute>
            }
          />
          
          {/* Redirección por defecto */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        
        {/* Notificaciones toast */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </Router>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
