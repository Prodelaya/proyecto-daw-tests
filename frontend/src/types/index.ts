// ============================================
// TIPOS TYPESCRIPT PARA FRONTEND
// ============================================

// BLOQUE 1: Usuario

/**
 * Usuario autenticado
 * 
 * Propiedades mínimas que vienen del backend tras login exitoso
 */
export interface User {
  id: number;
  email: string;
  name: string;
}

// BLOQUE 2: Preguntas

/**
 * Pregunta para mostrar en el test
 * 
 * IMPORTANTE: NO incluye correctAnswer (seguridad)
 * El backend solo lo envía al submitAttempt
 */
export interface Question {
  id: number;
  subjectCode: string;
  subjectName: string;
  topicNumber: number;
  topicTitle: string;
  text: string;
  options: string[];
  explanation: string;
  failedCount: number;
}

// BLOQUE 3: Attempts

/**
 * Respuesta individual del usuario
 * 
 * Se envía al backend en el array answers[]
 */
export interface Answer {
  questionId: number;
  userAnswer: string;
}

/**
 * Resultado detallado de una pregunta
 * 
 * Viene del backend tras submitAttempt
 * Incluye correctAnswer para mostrar en pantalla de resultados
 */
export interface QuestionResult {
  questionId: number;
  userAnswer: string;
  correctAnswer: string;
  correct: boolean;
  explanation: string;
}

/**
 * Resultado completo del intento
 * 
 * Respuesta del backend POST /api/attempts
 */
export interface AttemptResult {
  score: number;
  correct: number;
  total: number;
  results: QuestionResult[];
}

// BLOQUE 4: Estadísticas

/**
 * Estadística por asignatura/tema
 * 
 * Viene del backend GET /api/attempts/stats
 */
export interface SubjectStats {
  subjectCode: string;
  topicNumber: number | null;
  totalAttempts: number;
  avgScore: number;
}

/**
 * Respuesta completa de stats
 */
export interface Stats {
  stats: SubjectStats[];
  totalFailedQuestions: number;
}