import { Moon, Sun } from 'lucide-react'
import { useContext } from 'react'
import { createContext } from 'react'

// Crear contexto con valor por defecto
const ThemeContext = createContext(null)

export default function DarkModeToggle() {
  // Intentar obtener el contexto pero manejar si no existe
  let darkMode = false
  let toggleDarkMode = () => {}
  
  try {
    const context = useContext(ThemeContext)
    if (context) {
      darkMode = context.darkMode
      toggleDarkMode = context.toggleDarkMode
    }
  } catch (e) {
    // Si hay error, usar valores por defecto
  }

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
      title={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
    >
      {darkMode ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-gray-700" />
      )}
    </button>
  )
}
