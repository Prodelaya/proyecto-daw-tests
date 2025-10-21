// ============================================
// RESULTS - PÁGINA DE RESULTADOS
// ============================================

import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DarkModeToggle from '../components/DarkModeToggle';

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();

  // Datos recibidos desde TestView
  const { results, subject, topic, type } = location.state || {};

  // Si no hay datos, redirigir
  if (!results) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 p-6 rounded-lg">
          <p className="font-semibold mb-2 text-yellow-800 dark:text-yellow-300">⚠️ No hay resultados para mostrar</p>
          <Link to="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">
            ← Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { score, correct, total, results: questionResults } = results;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors duration-200">
            📊 Resultados del Test
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 dark:text-gray-300 transition-colors duration-200">
              <strong>{user?.name}</strong>
            </span>
            <DarkModeToggle />
            <button
              onClick={() => {
                logoutUser();
                navigate('/');
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-semibold transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Resumen de Score */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6 text-center transition-colors duration-200">
          <h2 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white transition-colors duration-200">
            {score >= 50 ? '🎉' : '📚'} {score}%
          </h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
            {correct} de {total} correctas
          </p>
          <p className={`text-lg font-semibold ${
            score >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {score >= 50 ? '✅ Aprobado' : '❌ Suspendido'}
          </p>
        </div>

        {/* Información del test */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6 transition-colors duration-200">
          <p className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-200">
            <strong>Asignatura:</strong> {subject} 
            {type === 'tema' && topic && ` - UT${topic}`}
            {type === 'final' && ' - Test Final'}
            {type === 'failed' && ' - Preguntas Falladas'}
          </p>
        </div>

        {/* Lista de Preguntas */}
        <div className="space-y-4">
          {questionResults.map((result: {
            questionId: string;
            correct: boolean;
            userAnswer: string;
            correctAnswer: string;
            explanation: string;
          }, index: number) => (
            <div
              key={result.questionId}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 transition-colors duration-200 ${
                result.correct ? 'border-green-500' : 'border-red-500'
              }`}
            >
              {/* Pregunta */}
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">
                  {result.correct ? '✅' : '❌'}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 dark:text-white mb-2 transition-colors duration-200">
                    Pregunta {index + 1}
                  </p>
                </div>
              </div>

              {/* Tu respuesta */}
              <div className="mb-3">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 transition-colors duration-200">
                  Tu respuesta:
                </p>
                <p className={`font-medium ${
                  result.correct 
                    ? 'text-green-700 dark:text-green-400' 
                    : 'text-red-700 dark:text-red-400'
                }`}>
                  {result.userAnswer}
                </p>
              </div>

              {/* Respuesta correcta (si falló) */}
              {!result.correct && (
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 transition-colors duration-200">
                    Respuesta correcta:
                  </p>
                  <p className="font-medium text-green-700 dark:text-green-400">
                    {result.correctAnswer}
                  </p>
                </div>
              )}

              {/* Explicación */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
                  <strong>Explicación:</strong> {result.explanation}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Botones finales */}
        <div className="flex gap-4 mt-8">
          <Link
            to="/dashboard"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold text-center transition"
          >
            🏠 Volver al Dashboard
          </Link>
          <Link
            to={`/subject/${subject}`}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold text-center transition"
          >
            🔄 Hacer Otro Test
          </Link>
        </div>

      </main>
    </div>
  );
}