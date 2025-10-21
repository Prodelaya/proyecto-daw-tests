// ============================================
// TEST CONFIG - CONFIGURACIÓN DE TEST
// ============================================

// BLOQUE 1: Imports

import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getQuestionsCount } from '../services/api';
import DarkModeToggle from '../components/DarkModeToggle';


// BLOQUE 2: Componente TestConfig

export default function TestConfig() {
  // ============================================
  // ESTADO Y HOOKS
  // ============================================
  
  // Hooks de navegación y autenticación
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logoutUser } = useAuth();
  
  // Estados
  const [availableCount, setAvailableCount] = useState<number>(0);
  const [selectedLimit, setSelectedLimit] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // ============================================
  // EXTRAER QUERY PARAMS
  // ============================================
  
  // Leer parámetros de la URL
  // Ejemplo: /test/config?subject=DWEC&topic=1&type=tema
  const searchParams = new URLSearchParams(location.search);
  const subjectCode = searchParams.get('subject');
  const topicNumber = searchParams.get('topic');
  const type = searchParams.get('type');
  
  
// ============================================
// USEEFFECT: CARGAR CANTIDAD DE PREGUNTAS
// ============================================
  
useEffect(() => {
  const fetchCount = async () => {
    // Validar que existen los parámetros necesarios
    if (!subjectCode || !type) {
      setError('Parámetros inválidos. Vuelve a la página anterior.');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Construir parámetros para la llamada
      const params: {
        subjectCode: string;
        topicNumber?: number;
        type?: 'tema' | 'final' | 'failed';
      } = {
        subjectCode,
        type: type as 'tema' | 'final' | 'failed'
      };
      
      // Si hay topicNumber (test por tema), añadirlo
      if (topicNumber) {
        params.topicNumber = parseInt(topicNumber, 10);
      }
      
      // Llamar al backend
      const data = await getQuestionsCount(params);
      
      // Guardar cantidad disponible
      setAvailableCount(data.count);
      
    } catch (err) {
      console.error('Error al obtener cantidad de preguntas:', err);
      setError('Error al cargar las preguntas disponibles');
    } finally {
      setLoading(false);
    }
  };
  
  fetchCount();
}, [subjectCode, topicNumber, type]);


// ============================================
// FUNCIÓN: GENERAR BOTONES DINÁMICOS
// ============================================

/**
 * Genera array de cantidades según preguntas disponibles
 * 
 * Ejemplos:
 * - 30 disponibles → [10, 20, 30]
 * - 15 disponibles → [10, 15]
 * - 8 disponibles → [8]
 * - 45 disponibles → [10, 20, 30, 40, 45]
 */
const generateButtons = (): number[] => {
  const buttons: number[] = [];
  
  // Si hay menos de 10, solo mostrar el máximo
  if (availableCount < 10) {
    return [availableCount];
  }
  
  // Botones de 10 en 10
  for (let i = 10; i <= availableCount; i += 10) {
    buttons.push(i);
  }
  
  // Si el máximo no es múltiplo de 10, añadirlo
  if (availableCount % 10 !== 0) {
    buttons.push(availableCount);
  }
  
  return buttons;
};


// ============================================
// FUNCIÓN: INICIAR TEST
// ============================================

/**
 * Navegar a la página de test con los parámetros completos
 */
const handleStart = () => {
  // Validar que se haya seleccionado una cantidad
  if (selectedLimit === null) {
    alert('Por favor, selecciona una cantidad de preguntas');
    return;
  }
  
  // Construir query string con todos los parámetros
  const params = new URLSearchParams({
    subject: subjectCode || '',
    type: type || '',
    limit: selectedLimit.toString()
  });
  
  // Añadir topicNumber solo si existe (tests por tema)
  if (topicNumber) {
    params.append('topic', topicNumber);
  }
  
  // Navegar a /test con todos los parámetros
  navigate(`/test?${params.toString()}`);
};
  
  
 // ============================================
// JSX: RENDERIZADO DEL COMPONENTE
// ============================================

return (
  <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
    {/* Header */}
    <header className="bg-white dark:bg-gray-800 shadow transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link
            to={`/subject/${subjectCode}`}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold"
          >
            ← Volver
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors duration-200">
            {subjectCode}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-700 dark:text-gray-300 transition-colors duration-200">
            <strong>{user?.name}</strong>
          </span>
          <DarkModeToggle />
          <button
            onClick={logoutUser}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-semibold transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>

    {/* Contenido principal */}
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 transition-colors duration-200">
        📊 Configuración del Test
      </h2>

      {/* LOADING */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center transition-colors duration-200">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando preguntas disponibles...</p>
        </div>
      )}

      {/* ERROR */}
      {error && !loading && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-6 py-4 rounded-lg">
          <p className="font-semibold">❌ Error</p>
          <p className="mt-1">{error}</p>
          <Link
            to={`/subject/${subjectCode}`}
            className="inline-block mt-4 text-red-800 dark:text-red-400 underline hover:text-red-900"
          >
            ← Volver a la asignatura
          </Link>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      {!loading && !error && (
        <>
          {/* Tarjeta de información */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8 transition-colors duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">
                {type === 'tema' && '📝'}
                {type === 'final' && '🎯'}
                {type === 'failed' && '❌'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white transition-colors duration-200">
                  {type === 'tema' && `Test por Tema - UT${topicNumber}`}
                  {type === 'final' && 'Test Final de Módulo'}
                  {type === 'failed' && 'Repaso de Preguntas Falladas'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {availableCount} pregunta{availableCount !== 1 ? 's' : ''} disponible{availableCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Mensaje si no hay preguntas */}
          {availableCount === 0 && (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 px-6 py-4 rounded-lg">
              <p className="font-semibold">⚠️ No hay preguntas disponibles</p>
              <p className="mt-1">
                {type === 'failed' 
                  ? 'Aún no has fallado ninguna pregunta. ¡Buen trabajo!'
                  : 'No hay preguntas cargadas para este tema.'}
              </p>
              <Link
                to={`/subject/${subjectCode}`}
                className="inline-block mt-4 text-yellow-900 dark:text-yellow-400 underline hover:text-yellow-950"
              >
                ← Volver a la asignatura
              </Link>
            </div>
          )}

          {/* Selección de cantidad */}
          {availableCount > 0 && (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 transition-colors duration-200">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 transition-colors duration-200">
                  Selecciona la cantidad de preguntas:
                </h3>

                {/* Botones de cantidad */}
                <div className="flex flex-wrap gap-3 mb-6">
                  {generateButtons().map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setSelectedLimit(amount)}
                      className={`px-6 py-3 rounded-lg font-semibold text-lg transition ${
                        selectedLimit === amount
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {amount === availableCount ? `MAX (${amount})` : amount}
                    </button>
                  ))}
                </div>

                {/* Indicador de selección */}
                {selectedLimit !== null && (
                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <p className="text-blue-800 dark:text-blue-300">
                      <strong>✓ Cantidad seleccionada:</strong> {selectedLimit} pregunta{selectedLimit !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>

              {/* Botón Comenzar Test */}
              <button
                onClick={handleStart}
                disabled={selectedLimit === null}
                className={`w-full py-4 rounded-lg font-bold text-lg transition ${
                  selectedLimit === null
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {selectedLimit === null
                  ? '⚠️ Selecciona una cantidad primero'
                  : '🚀 Comenzar Test'}
              </button>
            </>
          )}
        </>
      )}
    </main>
  </div>
);
}