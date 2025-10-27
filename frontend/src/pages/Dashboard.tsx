// ============================================
// DASHBOARD - PÁGINA PRINCIPAL
// ============================================

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSubjects } from '../services/api';
import DarkModeToggle from '../components/DarkModeToggle';

// Tipo para las asignaturas
interface Subject {
  subjectCode: string;
  subjectName: string;
  questionCount: number;
}

export default function Dashboard() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  
  // Estado: lista de asignaturas
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  // Estado: loading mientras carga
  const [loading, setLoading] = useState<boolean>(true);
  
  // Estado: mensaje de error
  const [error, setError] = useState<string>('');

  // Cargar asignaturas al montar el componente
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await getSubjects();
        setSubjects(data);
      } catch (err) {
        console.error('Error al cargar asignaturas:', err);
        setError('Error al cargar las asignaturas');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const handleLogout = () => {
    logoutUser();
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      {/* Header con logout */}
      <header className="bg-white dark:bg-gray-800 shadow transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          
          {/* Fila 1: Título + DarkMode */}
          <div className="flex justify-between items-center mb-3 sm:mb-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white transition-colors duration-200">
              📚 Tests DAW
            </h1>
            <div className="flex items-center gap-2 sm:hidden">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                <strong>{user?.name.split(' ')[0]}</strong>
              </span>
              <DarkModeToggle />
            </div>
          </div>

          {/* Fila 2: Botones Responsivos */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
            
            {/* Usuario (solo desktop) */}
            <span className="hidden sm:block text-gray-700 dark:text-gray-300 transition-colors duration-200">
              Hola, <strong>{user?.name}</strong>
            </span>

            {/* Contenedor de Botones */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* DarkMode (solo desktop) */}
              <div className="hidden sm:block">
                <DarkModeToggle />
              </div>

              {/* Estadísticas */}
              <Link
                to="/stats"
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-md font-semibold transition text-center text-sm sm:text-base"
              >
                📊 <span className="hidden sm:inline">Estadísticas</span>
              </Link>

              {/* Ranking */}
              <button
                onClick={() => navigate('/ranking')}
                className="flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition shadow-lg font-semibold text-sm sm:text-base"
              >
                🏆 <span className="hidden sm:inline">Ranking</span>
              </button>

              {/* Cerrar Sesión */}
              <button
                onClick={handleLogout}
                className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-md font-semibold transition text-sm sm:text-base"
              >
                <span className="sm:hidden">🚪</span>
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 transition-colors duration-200">
          Mis Asignaturas
        </h2>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando asignaturas...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Grid de asignaturas */}
        {!loading && !error && subjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {subjects.map((subject) => (
              <Link
                key={subject.subjectCode}
                to={`/subject/${subject.subjectCode}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all p-6 flex flex-col items-center text-center"
              >
                {/* Emoji según asignatura */}
                <div className="text-6xl mb-4">
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

                {/* Código asignatura */}
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 transition-colors duration-200">
                  {subject.subjectCode}
                </h3>

                {/* Nombre asignatura */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 transition-colors duration-200">
                  {subject.subjectName}
                </p>

                {/* Contador de preguntas */}
                <div className="mt-auto">
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                    subject.questionCount > 0
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {subject.questionCount} pregunta{subject.questionCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Mensaje si no hay asignaturas */}
        {!loading && !error && subjects.length === 0 && (
          <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 px-4 py-3 rounded">
            <p className="font-semibold">No hay asignaturas disponibles</p>
            <p className="text-sm mt-1">
              Ejecuta el seed para cargar preguntas: <code className="bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded">npm run seed</code>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
