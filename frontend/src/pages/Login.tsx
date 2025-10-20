// ============================================
// PÁGINA LOGIN/REGISTRO
// ============================================

// BLOQUE 1: Imports

import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';

// BLOQUE 2: Componente Login

export default function Login() {
  // Estado: Toggle entre Login y Registro
  const [isLogin, setIsLogin] = useState<boolean>(true);
  
  // Estado: Inputs del formulario
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  
  // Estado: Loading durante petición al backend
  const [loading, setLoading] = useState<boolean>(false);
  
  // Estado: Mensaje de error
  const [error, setError] = useState<string>('');
  
  // Acceder a funciones del AuthContext
  const { user, loginUser, registerUser } = useAuth();
  const navigate = useNavigate();

  // BLOQUE 3: Funciones
  
  /**
   * Manejar envío del formulario
   * 
   * Flujo:
   * 1. Prevenir recarga de página
   * 2. Validaciones frontend
   * 3. Llamar loginUser o registerUser según modo
   * 4. Manejar éxito/error
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Evitar recarga de página
    
    // Limpiar error previo
    setError('');
    
    // VALIDACIÓN 1: Email no vacío
    if (!email.trim()) {
      setError('El email es obligatorio');
      return;
    }
    
    // VALIDACIÓN 2: Email con formato válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email inválido');
      return;
    }
    
    // VALIDACIÓN 3: Password mínimo 6 caracteres
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    // VALIDACIÓN 4: Name requerido en modo Registro
    if (!isLogin && !name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    
    // Marcar como cargando
    setLoading(true);
    
    try {
      if (isLogin) {
        await loginUser(email, password);
      } else {
        await registerUser(email, password, name);
      }
      
      // Redirigir a dashboard tras login exitoso
      navigate('/dashboard');
      
    } catch (err: unknown) {
      // Capturar error del backend
      const errorMessage = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al conectar con el servidor';
      setError(errorMessage);
    } finally {
      // Siempre quitar loading al terminar
      setLoading(false);
    }
  };

  /**
   * Cambiar entre Login y Registro
   *
   * Limpia todos los inputs y errores al cambiar
   */
  const toggleMode = (mode: boolean) => {
    setIsLogin(mode);
    setEmail('');
    setPassword('');
    setName('');
    setError('');
  };

  // BLOQUE 4: JSX
  
  // Si ya hay usuario logueado, redirigir a dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Renderizar formulario Login/Registro
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">

        {/* Título */}
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          📚 Tests DAW
        </h1>

        {/* Toggle Login/Registro */}
        <div className="flex mb-6">
          <button
            type="button"
            onClick={() => toggleMode(true)}
            className={`flex-1 py-2 text-center font-semibold transition ${
              isLogin
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => toggleMode(false)}
            className={`flex-1 py-2 text-center font-semibold transition ${
              !isLogin
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Registro
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">

            {/* Input Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu@email.com"
              disabled={loading}
            />
          </div>

          {/* Input Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mínimo 6 caracteres"
              disabled={loading}
            />
          </div>

          {/* Input Name - Solo en modo Registro */}
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tu nombre completo"
                disabled={loading}
              />
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md font-semibold transition ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Cargando...' : isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </button>

          </form>
      </div>
    </div>
  );
}
