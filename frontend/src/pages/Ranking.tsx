// ============================================
// PÁGINA DE RANKING
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import DarkModeToggle from '../components/DarkModeToggle';

// ============================================
// TIPOS TYPESCRIPT
// ============================================

interface RankingUser {
  position: number;
  name: string;
  totalTests: number;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const Ranking = () => {
  // ============================================
  // ESTADO
  // ============================================
  
  const [data, setData] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // ============================================
  // FETCH DE DATOS
  // ============================================
  
  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const response = await apiClient.get('/ranking');
        setData(response.data);
      } catch (err) {
        setError('Error al cargar el ranking');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, []);

  // ============================================
  // FUNCIÓN: OBTENER TÍTULO ROAST
  // ============================================
  
  const getPodiumTitle = (position: number): string => {
    switch (position) {
      case 1: return "Más Tests que Vida Social";
      case 2: return "Casi Primero, pero No";
      case 3: return "Bronce Digno";
      default: return "";
    }
  };

  // ============================================
  // FUNCIÓN: OBTENER ALTURA DEL PODIO
  // ============================================
  
  const getPodiumHeight = (position: number): string => {
    switch (position) {
      case 1: return "h-48";  
      case 2: return "h-36";  
      case 3: return "h-28";  
      default: return "h-20";
    }
  };

  // ============================================
  // FUNCIÓN: OBTENER EMOJI DE MEDALLA
  // ============================================
  
  const getMedal = (position: number): string => {
    switch (position) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return "";
    }
  };

  // ============================================
  // ESTADOS DE CARGA Y ERROR
  // ============================================
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando ranking...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors duration-200">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center transition-colors duration-200">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // SEPARAR TOP 3 Y RESTO
  // ============================================
  
  const top3 = data.slice(0, 3);
  const rest = data.slice(3);

  // ============================================
  // RENDERIZADO PRINCIPAL
  // ============================================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        
        {/* ============================================ */}
        {/* HEADER CON DARK MODE TOGGLE */}
        {/* ============================================ */}
        
        <div className="flex justify-end mb-4">
          <DarkModeToggle />
        </div>

        {/* ============================================ */}
        {/* TÍTULO */}
        {/* ============================================ */}
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2 transition-colors duration-200">
            🏆 Ranking
          </h1>
          <p className="text-gray-600 dark:text-gray-400 transition-colors duration-200">
            Los valientes que más practican
          </p>
        </div>

        {/* PODIO - TOP 3 */}
        {top3.length > 0 && (
        <div className="mb-12">
            {/* ✅ RESPONSIVE: flex-wrap + width dinámico */}
            <div className="flex flex-wrap items-end justify-center gap-3 sm:gap-6 mb-8">
              
              {/* SEGUNDO PUESTO */}
              {top3[1] && (
                <div className="flex flex-col items-center w-28 sm:w-32 md:w-40">
                  <div className="text-3xl sm:text-5xl mb-2 sm:mb-3">{getMedal(2)}</div>
                  <div className={`bg-gradient-to-b from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 ${getPodiumHeight(2)} w-full rounded-t-lg ...`}>
                    <p className="text-white font-bold text-xs sm:text-sm md:text-base text-center px-1 sm:px-2 leading-tight">
                      {top3[1].name}
                    </p>
                    <p className="text-white text-[10px] sm:text-xs italic mt-1 sm:mt-2 text-center px-1 sm:px-2 leading-tight">
                      "{getPodiumTitle(2)}"
                    </p>
                    <p className="text-white text-xs sm:text-sm font-semibold mt-1 sm:mt-2">
                      {top3[1].totalTests} tests
                    </p>
                  </div>
                  <div className="bg-gray-500 dark:bg-gray-800 h-2 w-full rounded-b"></div>
                </div>
              )}

              {/* PRIMER PUESTO */}
              {top3[0] && (
                <div className="flex flex-col items-center w-28 sm:w-32 md:w-40">
                  <div className="text-4xl sm:text-6xl mb-2 sm:mb-3">{getMedal(1)}</div>
                  <div className={`bg-gradient-to-b from-yellow-400 to-yellow-600 dark:from-yellow-500 dark:to-yellow-700 ${getPodiumHeight(1)} w-full rounded-t-lg ...`}>
                    <p className="text-white font-bold text-xs sm:text-sm md:text-base text-center px-1 sm:px-2 leading-tight">
                      {top3[0].name}
                    </p>
                    <p className="text-white text-[10px] sm:text-xs italic mt-1 sm:mt-2 text-center px-1 sm:px-2 leading-tight">
                      "{getPodiumTitle(1)}"
                    </p>
                    <p className="text-white text-xs sm:text-sm font-semibold mt-1 sm:mt-2">
                      {top3[0].totalTests} tests
                    </p>
                  </div>
                  <div className="bg-yellow-700 dark:bg-yellow-900 h-2 w-full rounded-b"></div>
                </div>
              )}

              {/* TERCER PUESTO */}
              {top3[2] && (
                <div className="flex flex-col items-center w-28 sm:w-32 md:w-40">
                  <div className="text-3xl sm:text-5xl mb-2 sm:mb-3">{getMedal(3)}</div>
                  <div className={`bg-gradient-to-b from-orange-400 to-orange-600 dark:from-orange-500 dark:to-orange-700 ${getPodiumHeight(3)} w-full rounded-t-lg ...`}>
                    <p className="text-white font-bold text-xs sm:text-sm md:text-base text-center px-1 sm:px-2 leading-tight">
                      {top3[2].name}
                    </p>
                    <p className="text-white text-[10px] sm:text-xs italic mt-1 sm:mt-2 text-center px-1 sm:px-2 leading-tight">
                      "{getPodiumTitle(3)}"
                    </p>
                    <p className="text-white text-xs sm:text-sm font-semibold mt-1 sm:mt-2">
                      {top3[2].totalTests} tests
                    </p>
                  </div>
                  <div className="bg-orange-700 dark:bg-orange-900 h-2 w-full rounded-b"></div>
                </div>
              )}
              
            </div>
        </div>
        )}

        {/* ============================================ */}
        {/* TABLA - RESTO DE USUARIOS */}
        {/* ============================================ */}
        
        {rest.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8 transition-colors duration-200">
            <table className="w-full">
              <thead className="bg-indigo-600 dark:bg-indigo-800 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Posición</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Nombre</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Tests Realizados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {rest.map((user) => (
                  <tr key={user.position} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{user.position}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 text-right">{user.totalTests}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ============================================ */}
        {/* BOTÓN VOLVER */}
        {/* ============================================ */}
        
        <div className="text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition shadow-lg"
          >
            ← Volver al Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};

export default Ranking;