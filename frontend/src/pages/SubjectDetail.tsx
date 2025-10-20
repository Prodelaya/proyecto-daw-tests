// ============================================
// SUBJECT DETAIL - DETALLE DE ASIGNATURA
// ============================================

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTopicsBySubject, getQuestionsCount } from '../services/api';

// Tipo para los temas
interface Topic {
  topicNumber: number;
  topicTitle: string;
  questionCount: number;
}

export default function SubjectDetail() {
  const { subjectCode } = useParams<{ subjectCode: string }>();
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  // Estados
  const [topics, setTopics] = useState<Topic[]>([]);
  const [failedCount, setFailedCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showTopics, setShowTopics] = useState<boolean>(false);

  // Cargar datos al montar
  useEffect(() => {
    const fetchData = async () => {
      if (!subjectCode) return;

      try {
        // Obtener temas con contadores
        const topicsData = await getTopicsBySubject(subjectCode);
        setTopics(topicsData);

        // Obtener contador de falladas
        const failedData = await getQuestionsCount({
          subjectCode,
          type: 'failed'
        });
        setFailedCount(failedData.count);

      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos de la asignatura');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subjectCode]);

  const handleLogout = () => {
    logoutUser();
  };

  const handleTopicSelect = (topicNumber: number) => {
    navigate(`/test/config?subject=${subjectCode}&topic=${topicNumber}&type=tema`);
  };

  const handleCompleteTest = () => {
    navigate(`/test/config?subject=${subjectCode}&type=final`);
  };

  const handleFailedTest = () => {
    if (failedCount === 0) {
      alert('¡No tienes preguntas falladas aún! 🎉');
      return;
    }
    navigate(`/test/config?subject=${subjectCode}&type=failed`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              ← Volver
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">
              {subjectCode}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">
              <strong>{user?.name}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-semibold transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">
          Tipos de Test
        </h2>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Grid de opciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Opción 1: Test por Tema */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Test por Tema
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              Practica preguntas de una unidad temática específica
            </p>
            
            {/* Botón para expandir/colapsar lista */}
            <button
              onClick={() => setShowTopics(!showTopics)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-semibold transition mb-4"
            >
              {showTopics ? 'Ocultar Temas' : 'Seleccionar Tema'}
            </button>

            {/* Lista de temas */}
            {showTopics && (
              <div className="space-y-2">
                {topics.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-2">
                    No hay temas disponibles
                  </p>
                ) : (
                  topics.map(topic => (
                    <button
                      key={topic.topicNumber}
                      onClick={() => handleTopicSelect(topic.topicNumber)}
                      className="w-full text-left px-3 py-2 bg-gray-100 hover:bg-blue-50 rounded border border-gray-300 hover:border-blue-400 transition"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-800">
                          UT{topic.topicNumber}
                        </span>
                        <span className="text-xs text-gray-600">
                          {topic.questionCount} pregs
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {topic.topicTitle}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Opción 2: Test Completo */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Test Completo
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              Preguntas aleatorias de todas las unidades mezcladas
            </p>
            <button
              onClick={handleCompleteTest}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-semibold transition"
            >
              Comenzar Test
            </button>
          </div>

          {/* Opción 3: Preguntas Falladas */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-5xl mb-4">❌</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Preguntas Falladas
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              Repasa las preguntas que has respondido incorrectamente
            </p>
            
            {/* Badge con contador */}
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                failedCount > 0
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {failedCount} fallada{failedCount !== 1 ? 's' : ''}
              </span>
            </div>

            <button
              onClick={handleFailedTest}
              disabled={failedCount === 0}
              className={`w-full py-2 px-4 rounded-md font-semibold transition ${
                failedCount > 0
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {failedCount > 0 ? 'Repasar Falladas' : 'Sin Preguntas Falladas'}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}