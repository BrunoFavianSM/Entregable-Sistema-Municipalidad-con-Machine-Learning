import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function RecuperarPassword() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1); // 1: DNI, 2: Pregunta, 3: Nueva contraseña
  const [dni, setDni] = useState('');
  const [pregunta, setPregunta] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const handlePaso1 = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/auth/obtener-pregunta/${dni}`, {
        method: 'GET'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPregunta(data.pregunta);
        setPaso(2);
      } else {
        setError(data.error || 'Error al obtener pregunta de seguridad');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaso2 = async (e) => {
    e.preventDefault();
    
    if (nuevaPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/recuperar-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dni,
          respuesta: respuesta,
          nueva_password: nuevaPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPaso(3);
      } else {
        setError(data.error || 'Error al restablecer contraseña');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Recuperar Contraseña</h2>
          <p className="mt-2 text-gray-600">Municipalidad Provincial de Yau</p>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center ${paso >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${paso >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="ml-2 text-sm hidden sm:inline">DNI</span>
          </div>
          <div className={`w-12 h-1 mx-2 ${paso >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center ${paso >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${paso >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="ml-2 text-sm hidden sm:inline">Verificar</span>
          </div>
          <div className={`w-12 h-1 mx-2 ${paso >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center ${paso >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${paso >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <span className="ml-2 text-sm hidden sm:inline">Listo</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Paso 1: Ingresar DNI */}
        {paso === 1 && (
          <form onSubmit={handlePaso1} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingresa tu DNI
              </label>
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                maxLength={8}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="12345678"
              />
              <p className="text-sm text-gray-500 mt-2">
                Ingresa el DNI con el que te registraste
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || dni.length !== 8}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'Continuar'}
            </button>
          </form>
        )}

        {/* Paso 2: Responder pregunta y nueva contraseña */}
        {paso === 2 && (
          <form onSubmit={handlePaso2} className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">Pregunta de Seguridad:</p>
              <p className="text-blue-800">{pregunta}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tu Respuesta
              </label>
              <input
                type="text"
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Escribe tu respuesta"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={mostrarPassword ? "text" : "password"}
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {mostrarPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Nueva Contraseña
              </label>
              <input
                type={mostrarPassword ? "text" : "password"}
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Actualizando...' : 'Restablecer Contraseña'}
            </button>

            <button
              type="button"
              onClick={() => {
                setPaso(1);
                setRespuesta('');
                setNuevaPassword('');
                setConfirmarPassword('');
                setError('');
              }}
              className="w-full text-gray-600 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              Volver
            </button>
          </form>
        )}

        {/* Paso 3: Éxito */}
        {paso === 3 && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900">
              ¡Contraseña Actualizada!
            </h3>
            
            <p className="text-gray-600">
              Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.
            </p>

            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Ir a Iniciar Sesión
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-blue-600 hover:text-blue-700">
            ← Volver al Login
          </Link>
        </div>
      </div>
    </div>
  );
}
