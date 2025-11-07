import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    // Configurar interceptor de axios
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
      setToken(storedToken)
      // Intentar cargar datos del usuario
      loadUserData()
    } else {
      setLoading(false)
    }
  }, [])

  const loadUserData = async () => {
    try {
      // El usuario se guarda en localStorage al hacer login
      const userData = localStorage.getItem('user')
      if (userData) {
        setUser(JSON.parse(userData))
      }
    } catch (error) {
      console.error('Error cargando usuario:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (dni, password = null, useFacial = false, imageData = null) => {
    try {
      let response
      
      if (useFacial && imageData) {
        // Login con reconocimiento facial
        response = await axios.post('/api/auth/login-facial', {
          image: imageData
        })
      } else if (password) {
        // Login con DNI y contraseña
        response = await axios.post('/api/auth/login', { dni, password })
      } else {
        // Login solo con DNI (modo legacy)
        response = await axios.post('/api/auth/login', { dni })
      }

      const { access_token, usuario } = response.data
      
      console.log('✅ Login exitoso, guardando token...')
      console.log('Token:', access_token)
      console.log('Usuario:', usuario)
      
      // Guardar token y usuario
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(usuario))
      setToken(access_token)
      setUser(usuario)
      
      // Configurar header para todas las peticiones
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      
      console.log('✅ Token configurado en axios')
      
      toast.success(`¡Bienvenido, ${usuario.nombres}!`)
      return true
    } catch (error) {
      console.error('❌ Error en login:', error)
      const errorMsg = error.response?.data?.error || 'Error al iniciar sesión'
      toast.error(errorMsg)
      return false
    }
  }

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData)
      toast.success('Registro exitoso. Ahora puedes iniciar sesión.')
      return true
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error al registrar usuario'
      toast.error(errorMsg)
      return false
    }
  }

  const registerFace = async (imageData) => {
    try {
      console.log('Registrando rostro...')
      const response = await axios.post('/api/auth/register-face', { image: imageData })
      console.log('Respuesta:', response.data)
      
      // Actualizar usuario local
      const updatedUser = { ...user, tiene_face_encoding: true }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      toast.success('Rostro registrado exitosamente')
      return true
    } catch (error) {
      console.error('Error completo:', error)
      console.error('Error response:', error.response?.data)
      const errorMsg = error.response?.data?.error || 'Error al registrar rostro'
      toast.error(errorMsg)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
    toast.success('Sesión cerrada')
  }

  const value = {
    user,
    loading,
    login,
    register,
    registerFace,
    logout,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
