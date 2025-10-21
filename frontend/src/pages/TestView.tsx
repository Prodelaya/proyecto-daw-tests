// ============================================
// TEST VIEW - EJECUCIÓN DE TEST
// ============================================

// BLOQUE 1: Imports

import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Question } from '../types';
import { apiClient } from '../services/api';
import DarkModeToggle from '../components/DarkModeToggle';

// Tipo para feedback inmediato (modo práctica)
interface InstantFeedback {
  correct: boolean;
  correctAnswer: string;
  explanation: string;
}

// Tipo para pregunta con respuesta (modo práctica)
interface QuestionWithAnswer extends Question {
  correctAnswer: string;
}

export default function TestView() {
  // Hooks
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Query params
  const searchParams = new URLSearchParams(location.search);
  const subject = searchParams.get('subject');
  const topicStr = searchParams.get('topic');
  const type = searchParams.get('type');
  const limitStr = searchParams.get('limit');
  
  const topic = topicStr ? parseInt(topicStr, 10) : null;
  const limit = limitStr ? parseInt(limitStr, 10) : 20;

  // ESTADOS
  const [practiceMode, setPracticeMode] = useState<boolean>(true); // Toggle modo
  const [questions, setQuestions] = useState<Question[]>([]); // Array de preguntas
  const [currentIndex, setCurrentIndex] = useState<number>(0); // Índice actual
  const [userAnswers, setUserAnswers] = useState<Map<number, string>>(new Map()); // questionId → respuesta
  const [instantFeedback, setInstantFeedback] = useState<InstantFeedback | null>(null); // Feedback inmediato
  const [loading, setLoading] = useState<boolean>(true); // Loading inicial
  const [submitting, setSubmitting] = useState<boolean>(false); // Enviando intento
  const [error, setError] = useState<string>(''); // Error message

  // Pregunta actual
  const currentQuestion = questions[currentIndex];

  // ============================================
  // BLOQUE 2: useEffect - Fetch de Preguntas
  // ============================================

  useEffect(() => {
    const fetchQuestions = async () => {
      // Validar parámetros obligatorios
      if (!subject || !type) {
        setError('Parámetros de URL incompletos');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Token del localStorage (interceptor lo añade automáticamente)
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }

        // Construir query params
        interface QueryParams {
          subjectCode: string | null;
          type: string | null;
          limit: number;
          topicNumber?: number;
        }

        const params: QueryParams = {
          subjectCode: subject,
          type: type,
          limit: limit
        };

        if (topic) {
          params.topicNumber = topic;
        }

        // 🟢 FETCH CONDICIONAL según modo
        const endpoint = practiceMode 
          ? '/questions/practice'  // ✅ Incluye correctAnswer
          : '/questions';          // ❌ NO incluye correctAnswer

        const { data } = await apiClient.get(endpoint, { params });


        setQuestions(data);
        
        // Si no hay preguntas
        if (data.length === 0) {
          setError('No hay preguntas disponibles con estos filtros');
        }

      } catch (err) {
        console.error('Error al cargar preguntas:', err);
        setError('Error al cargar las preguntas');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [subject, topic, type, limit, practiceMode, navigate]);

  // ============================================
  // BLOQUE 2: Funciones auxiliares
  // ============================================

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  // ============================================
  // BLOQUE 3: Manejo de respuestas
  // ============================================

  const handleAnswerSelect = (selectedAnswer: string) => {
    if (!currentQuestion) return;

    // Crear nueva Map (para forzar re-render)
    const newAnswers = new Map(userAnswers);
    newAnswers.set(currentQuestion.id, selectedAnswer);
    setUserAnswers(newAnswers);

    // 🟢 MODO PRÁCTICA: Mostrar feedback inmediato
    if (practiceMode) {
      // En modo práctica, currentQuestion tiene correctAnswer (tipo QuestionWithAnswer)
      const questionWithAnswer = currentQuestion as QuestionWithAnswer;
      const isCorrect = selectedAnswer === questionWithAnswer.correctAnswer;
      
      setInstantFeedback({
        correct: isCorrect,
        correctAnswer: questionWithAnswer.correctAnswer,
        explanation: currentQuestion.explanation
      });
    } else {
      // 🔴 MODO EXAMEN: Sin feedback
      setInstantFeedback(null);
    }
  };
  
 // ============================================
  // BLOQUE 4: Navegación entre preguntas
  // ============================================

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setInstantFeedback(null); // Limpiar feedback al cambiar
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setInstantFeedback(null); // Limpiar feedback al cambiar
    }
  };
  
  // ============================================
  // BLOQUE 5: Finalizar test y enviar
  // ============================================

  const handleFinishTest = async () => {
    // Validar que todas las preguntas tienen respuesta
    const allAnswered = questions.every(q => userAnswers.has(q.id));

    if (!allAnswered) {
      const unanswered = questions.length - userAnswers.size;
      alert(`⚠️ Te faltan ${unanswered} pregunta${unanswered !== 1 ? 's' : ''} por responder.\n\nPor favor, responde todas antes de finalizar.`);
      return;
    }

    // Confirmar antes de enviar
    const confirmed = window.confirm(
      `¿Estás seguro de finalizar el test?\n\n` +
      `Has respondido ${userAnswers.size} de ${questions.length} preguntas.\n\n` +
      `Una vez enviado, no podrás cambiar tus respuestas.`
    );

    if (!confirmed) return;

    try {
      setSubmitting(true);

      // Construir array de respuestas para el backend
      const answers = Array.from(userAnswers.entries()).map(([questionId, userAnswer]) => ({
        questionId,
        userAnswer
      }));

      // Construir payload
      const payload = {
        subjectCode: subject!,
        topicNumber: topic,
        answers
      };

      // Enviar al backend
      const { data } = await apiClient.post('/attempts', payload);

      // Navegar a Results con los datos
      navigate('/results', { 
        state: { 
          results: data,
          subject: subject,
          topic: topic,
          type: type
        } 
      });

    } catch (err) {
      console.error('Error al enviar intento:', err);
      alert('❌ Error al enviar el test. Por favor, inténtalo de nuevo.');
      setSubmitting(false);
    }
  };
  
  const handleModeToggle = () => {
    // Solo permitir cambiar modo ANTES de responder preguntas
    if (userAnswers.size === 0) {
      setPracticeMode(!practiceMode);
      setInstantFeedback(null); // Limpiar feedback
    } else {
      alert('No puedes cambiar el modo después de empezar a responder');
    }
  };
  
  // ============================================
  // BLOQUE 2: JSX
  // ============================================

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando preguntas...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-6 py-4 rounded-lg max-w-md">
          <p className="font-semibold mb-2">❌ {error || 'No hay preguntas'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Icono Dashboard */}
            <Link
              to="/dashboard"
              className="text-3xl hover:scale-110 transition-transform"
              title="Ir al Dashboard"
            >
              📚
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors duration-200">
              {subject} - Test {type === 'tema' ? `UT${topic}` : type === 'final' ? 'Final' : 'Falladas'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {questions.length} pregunta{questions.length !== 1 ? 's' : ''}
            </p>
          </div>
          </div>
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

      {/* Contenido Principal */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Toggle de Modo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1 text-gray-800 dark:text-white">Modo de Test</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {practiceMode 
                  ? '🟢 Recibirás feedback inmediato tras cada respuesta' 
                  : '🔴 Sin feedback hasta finalizar el test'}
              </p>
            </div>
            
            {/* Toggle Switch */}
            <button
              onClick={handleModeToggle}
              disabled={userAnswers.size > 0}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition ${
                practiceMode ? 'bg-green-500' : 'bg-red-500'
              } ${userAnswers.size > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                practiceMode ? 'translate-x-9' : 'translate-x-1'
              }`} />
            </button>
            
            <div className="text-right ml-4">
              <p className="font-semibold text-lg text-gray-800 dark:text-white">
                {practiceMode ? '🟢 Práctica' : '🔴 Examen'}
              </p>
            </div>
          </div>
        </div>

        {/* BLOQUE 3: Pregunta Actual */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6 transition-colors duration-200">
          
          {/* Progreso */}
          <div className="mb-6 flex justify-between items-center">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Pregunta {currentIndex + 1} de {questions.length}
            </p>
            <div className="w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Texto de la pregunta */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 transition-colors duration-200">
              {currentQuestion?.text}
            </h2>
          </div>

          {/* Opciones */}
          <div className="space-y-3 mb-6">
            {currentQuestion?.options.map((option, index) => {
              const isSelected = userAnswers.get(currentQuestion.id) === option;
              
              return (
                <label
                  key={index}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={isSelected}
                    onChange={() => handleAnswerSelect(option)}
                    className="w-5 h-5 text-blue-600 mr-4"
                  />
                  <span className="text-lg text-gray-800 dark:text-white">{option}</span>
                </label>
              );
            })}
          </div>

          {/* 🟢 FEEDBACK INMEDIATO (Solo Modo Práctica) */}
          {practiceMode && instantFeedback && (
            <div className={`p-4 rounded-lg border-2 mb-6 transition-colors duration-200 ${
              instantFeedback.correct
                ? 'bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-700'
                : 'bg-red-50 dark:bg-red-900/30 border-red-400 dark:border-red-700'
            }`}>
              <p className={`font-bold text-lg mb-2 ${
                instantFeedback.correct 
                  ? 'text-green-800 dark:text-green-300' 
                  : 'text-red-800 dark:text-red-300'
              }`}>
                {instantFeedback.correct ? '✅ ¡Correcto!' : '❌ Incorrecto'}
              </p>
              
              {!instantFeedback.correct && (
                <p className="text-red-700 dark:text-red-300 mb-2">
                  <strong>Respuesta correcta:</strong> {instantFeedback.correctAnswer}
                </p>
              )}
              
              <div className="text-gray-700 dark:text-gray-300 text-sm mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                <strong>Explicación:</strong> {instantFeedback.explanation}
              </div>
            </div>
          )}

          {/* BLOQUE 4: Botones de Navegación */}
          <div className="flex justify-between items-center">
            
            {/* Botón Anterior */}
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                currentIndex === 0
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white'
              }`}
            >
              ← Anterior
            </button>

            {/* Indicador visual de respuestas */}
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {userAnswers.size} de {questions.length} respondidas
              </p>
              <div className="flex gap-1 mt-2">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`w-2 h-2 rounded-full ${
                      userAnswers.has(q.id)
                        ? 'bg-green-500'
                        : idx === currentIndex
                        ? 'bg-blue-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Botón Siguiente o Finalizar */}
            {currentIndex < questions.length - 1 ? (
              <button
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Siguiente →
              </button>
            ) : (
              <button
                onClick={handleFinishTest}
                disabled={submitting}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                    submitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                >
                {submitting ? '⏳ Enviando...' : '🏁 Finalizar Test'}
                </button>
            )}

          </div>
        </div>

      </main>
    </div>
  );
}