// ============================================
// STATS - PÁGINA DE ESTADÍSTICAS
// ============================================

// BLOQUE 1: Imports

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStats } from '../services/api';
import { Stats as StatsType, SubjectStats } from '../types';
import DarkModeToggle from '../components/DarkModeToggle';


// BLOQUE 2: Interfaces Locales

// Interfaz para stats agrupadas por asignatura
interface GroupedStats {
  subjectCode: string;
  subjectName: string;
  totalAttempts: number;
  avgScore: number;
  topics: {
    topicNumber: number | null;
    topicTitle: string;
    attempts: number;
    avgScore: number;
  }[];
}


// BLOQUE 3: Componente Stats

export default function Stats() {
  // ============================================
  // HOOKS Y ESTADOS
  // ============================================
  
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  // Estados
  const [stats, setStats] = useState<StatsType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');


  // ============================================
  // BLOQUE 4: useEffect - FETCH DATOS
  // ============================================

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStats();
        setStats(data);
      } catch (err) {
        console.error('Error al cargar estadísticas:', err);
        setError('Error al cargar las estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);


  // ============================================
  // BLOQUE 5: FUNCIONES AUXILIARES
  // ============================================

  // Obtener nombre completo de asignatura
  const getSubjectName = (code: string): string => {
    const names: Record<string, string> = {
      'DWEC': 'Desarrollo Web Entorno Cliente',
      'DWES': 'Desarrollo Web Entorno Servidor',
      'DAW': 'Despliegue Aplicaciones Web',
      'DIW': 'Diseño Interfaces Web',
      'DASP': 'Desarrollo Aplicaciones Seguras y Privadas',
      'IPE': 'Itinerario Personal para la Empleabilidad',
      'CIBER': 'Ciberseguridad',
      'SASP': 'Servicios Administración Sistemas Planificación'
    };
    return names[code] || code;
  };

  // Obtener título de tema
  const getTopicTitle = (topicNumber: number | null): string => {
    if (topicNumber === null) return 'Test Final';
    return `UT${topicNumber}`;
  };

  // Agrupar stats por asignatura
  const groupBySubject = (): GroupedStats[] => {
    if (!stats || stats.stats.length === 0) return [];

    const grouped: Record<string, GroupedStats> = {};

    stats.stats.forEach((stat: SubjectStats) => {
      const key = stat.subjectCode;

      if (!grouped[key]) {
        grouped[key] = {
          subjectCode: stat.subjectCode,
          subjectName: getSubjectName(stat.subjectCode),
          totalAttempts: 0,
          avgScore: 0,
          topics: []
        };
      }

      // Sumar intentos
      grouped[key].totalAttempts += stat.totalAttempts;

      // Añadir tema a la lista
      grouped[key].topics.push({
        topicNumber: stat.topicNumber,
        topicTitle: getTopicTitle(stat.topicNumber),
        attempts: stat.totalAttempts,
        avgScore: stat.avgScore
      });
    });

    // Calcular promedio de asignatura (media ponderada)
    Object.values(grouped).forEach(subject => {
      const totalScore = subject.topics.reduce(
        (sum, topic) => sum + (topic.avgScore * topic.attempts),
        0
      );
      subject.avgScore = Math.round(totalScore / subject.totalAttempts);
    });

    return Object.values(grouped);
  };

  // Calcular totales globales
  const calculateGlobalStats = () => {
    if (!stats || stats.stats.length === 0) {
      return { totalTests: 0, avgScore: 0 };
    }

    const totalTests = stats.stats.reduce(
      (sum, stat) => sum + stat.totalAttempts, 
      0
    );

    const totalScore = stats.stats.reduce(
      (sum, stat) => sum + (stat.avgScore * stat.totalAttempts),
      0
    );

    const avgScore = totalTests > 0 
      ? Math.round(totalScore / totalTests) 
      : 0;

    return { totalTests, avgScore };
  };

  const globalStats = calculateGlobalStats();
  const groupedStats = groupBySubject();


  // ============================================
  // BLOQUE 6: FUNCIONES DE NAVEGACIÓN
  // ============================================

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  const handleRepasarFalladas = () => {
    // Redirigir al dashboard para elegir asignatura
    alert('Ve al Dashboard y selecciona una asignatura para repasar falladas');
  };


  // ============================================
  // BLOQUE 7: JSX
  // ============================================

  // LOADING
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  // ERROR
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-6 py-4 rounded-lg max-w-md">
          <p className="font-semibold mb-2">❌ {error}</p>
          <Link to="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">
            ← Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // SIN DATOS
  if (!stats || stats.stats.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors duration-200">
              📊 Mis Estadísticas
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-700 dark:text-gray-300 transition-colors duration-200">
                <strong>{user?.name}</strong>
              </span>
              <DarkModeToggle />
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-semibold transition"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </header>

        {/* Mensaje sin datos */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 px-6 py-8 rounded-lg text-center">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-xl font-semibold mb-2">
              Aún no has realizado ningún test
            </p>
            <p className="text-gray-700 dark:text-gray-400 mb-6">
              Comienza a practicar para ver tus estadísticas aquí
            </p>
            <Link
              to="/dashboard"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              🏠 Ir al Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // CONTENIDO NORMAL
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <header className="bg-white dark:bg-gray-800 shadow transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          
          {/* Fila 1: Volver + Título + DarkMode (móvil) */}
          <div className="flex justify-between items-center mb-2 sm:mb-0">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                to="/dashboard"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold text-sm sm:text-base"
              >
                ← Volver
              </Link>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white transition-colors duration-200">
                📊 Mis Estadísticas
              </h1>
            </div>
            
            {/* DarkMode solo en móvil */}
            <div className="sm:hidden">
              <DarkModeToggle />
            </div>
          </div>

          {/* Fila 2: Usuario + Botones (responsive) */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            
            {/* Usuario */}
            <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 transition-colors duration-200">
              <strong className="hidden sm:inline">{user?.name}</strong>
              <strong className="sm:hidden">{user?.name.split(' ')[0]}</strong>
            </span>

            {/* Botones */}
            <div className="flex items-center gap-2">
              {/* DarkMode solo en desktop */}
              <div className="hidden sm:block">
                <DarkModeToggle />
              </div>
              
              {/* Botón Cerrar Sesión */}
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-md font-semibold transition text-sm sm:text-base"
              >
                <span className="sm:hidden">🚪</span>
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* ============================================ */}
      {/* CONTENIDO PRINCIPAL */}
      {/* ============================================ */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* ============================================ */}
        {/* RESUMEN GLOBAL - 3 TARJETAS */}
        {/* ============================================ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Tarjeta 1: Tests Realizados */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center transition-colors duration-200">
            <div className="text-5xl mb-3">🎯</div>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold uppercase mb-2">
              Tests Realizados
            </p>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {globalStats.totalTests}
            </p>
          </div>

          {/* Tarjeta 2: Promedio General */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center transition-colors duration-200">
            <div className="text-5xl mb-3">📊</div>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold uppercase mb-2">
              Promedio General
            </p>
            <p className={`text-4xl font-bold ${
              globalStats.avgScore >= 80 ? 'text-green-600 dark:text-green-400' :
              globalStats.avgScore >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
              'text-red-600 dark:text-red-400'
            }`}>
              {globalStats.avgScore}%
            </p>
          </div>

          {/* Tarjeta 3: Preguntas Falladas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center transition-colors duration-200">
            <div className="text-5xl mb-3">❌</div>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold uppercase mb-2">
              Preguntas Falladas
            </p>
            <p className={`text-4xl font-bold ${
              stats.totalFailedQuestions > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
            }`}>
              {stats.totalFailedQuestions}
            </p>
          </div>

        </div>

        {/* ============================================ */}
        {/* ESTADÍSTICAS POR ASIGNATURA */}
        {/* ============================================ */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 transition-colors duration-200">
            📚 Desglose por Asignatura
          </h2>

          <div className="space-y-6">
            {groupedStats.map((subject) => (
              <div
                key={subject.subjectCode}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200"
              >
                {/* Header de Asignatura */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">
                      {subject.subjectCode === 'DWEC' && '🌐'}
                      {subject.subjectCode === 'DWES' && '⚙️'}
                      {subject.subjectCode === 'DAW' && '🚀'}
                      {subject.subjectCode === 'DIW' && '🎨'}
                      {subject.subjectCode === 'DASP' && '🔐'}
                      {subject.subjectCode === 'IPE' && '💼'}
                      {subject.subjectCode === 'CIBER' && '🛡️'}
                      {subject.subjectCode === 'SASP' && '🔧'}
                      {!['DWEC', 'DWES', 'DAW', 'DIW', 'DASP', 'IPE', 'CIBER', 'SASP'].includes(subject.subjectCode) && '📖'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white transition-colors duration-200">
                        {subject.subjectCode}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {subject.subjectName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Intentos</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">
                      {subject.totalAttempts}
                    </p>
                    <p className={`text-lg font-semibold ${
                      subject.avgScore >= 80 ? 'text-green-600 dark:text-green-400' :
                      subject.avgScore >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      Promedio: {subject.avgScore}%
                    </p>
                  </div>
                </div>

                {/* Desglose por Temas */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase mb-3">
                    Por Temas:
                  </h4>
                  <div className="space-y-2">
                    {subject.topics.map((topic, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {topic.topicNumber === null ? '🎯' : '📝'}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-white">
                              {topic.topicTitle}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {topic.attempts} intento{topic.attempts !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                            topic.avgScore >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                            topic.avgScore >= 50 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                            'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}>
                            {topic.avgScore}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* ============================================ */}
        {/* BANNER DE PREGUNTAS FALLADAS */}
        {/* ============================================ */}
        {stats.totalFailedQuestions > 0 ? (
          <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-lg p-6 text-center transition-colors duration-200">
            <div className="text-5xl mb-4">❌</div>
            <h3 className="text-2xl font-bold text-red-800 dark:text-red-300 mb-2">
              Tienes {stats.totalFailedQuestions} pregunta{stats.totalFailedQuestions !== 1 ? 's' : ''} pendiente{stats.totalFailedQuestions !== 1 ? 's' : ''} de repasar
            </h3>
            <p className="text-gray-700 dark:text-gray-400 mb-6">
              Repasa las preguntas que has fallado para mejorar tu puntuación
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRepasarFalladas}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                🔄 Repasar Falladas
              </button>
              <Link
                to="/dashboard"
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                🏠 Volver al Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700 rounded-lg p-6 text-center transition-colors duration-200">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">
              ¡Sin preguntas pendientes!
            </h3>
            <p className="text-gray-700 dark:text-gray-400 mb-6">
              Has repasado todas las preguntas falladas. ¡Sigue practicando!
            </p>
            <Link
              to="/dashboard"
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              🏠 Volver al Dashboard
            </Link>
          </div>
        )}

      </main>
    </div>
  );
}