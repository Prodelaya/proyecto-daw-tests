// ============================================
// RESULTS - PÁGINA DE RESULTADOS
// ============================================

import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();

  // Datos recibidos desde TestView
  const { results, subject, topic, type } = location.state || {};

  // Si no hay datos, redirigir
  if (!results) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-yellow-100 border border-yellow-400 p-6 rounded-lg">
          <p className="font-semibold mb-2">⚠️ No hay resultados para mostrar</p>
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            ← Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { score, correct, total, results: questionResults } = results;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            📊 Resultados del Test
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">
              <strong>{user?.name}</strong>
            </span>
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
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 text-center">
          <h2 className="text-4xl font-bold mb-4">
            {score >= 50 ? '🎉' : '📚'} {score}%
          </h2>
          <p className="text-xl text-gray-700 mb-2">
            {correct} de {total} correctas
          </p>
          <p className={`text-lg font-semibold ${
            score >= 50 ? 'text-green-600' : 'text-red-600'
          }`}>
            {score >= 50 ? '✅ Aprobado' : '❌ Suspendido'}
          </p>
        </div>

        {/* Información del test */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">
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
              className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                result.correct ? 'border-green-500' : 'border-red-500'
              }`}
            >
              {/* Pregunta */}
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">
                  {result.correct ? '✅' : '❌'}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 mb-2">
                    Pregunta {index + 1}
                  </p>
                </div>
              </div>

              {/* Tu respuesta */}
              <div className="mb-3">
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Tu respuesta:
                </p>
                <p className={`font-medium ${
                  result.correct ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.userAnswer}
                </p>
              </div>

              {/* Respuesta correcta (si falló) */}
              {!result.correct && (
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-600 mb-1">
                    Respuesta correcta:
                  </p>
                  <p className="font-medium text-green-700">
                    {result.correctAnswer}
                  </p>
                </div>
              )}

              {/* Explicación */}
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">
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