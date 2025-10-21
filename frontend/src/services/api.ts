// ============================================
// SERVICIO API - COMUNICACIÓN CON BACKEND
// ============================================

// BLOQUE 1: Imports

import axios from 'axios';
import {
  User,
  Question,
  AttemptResult,
  Stats,
  Answer
} from '../types';


// BLOQUE 2: Configuración de Axios

/**
 * Cliente axios configurado con baseURL del backend
 * 
 * En desarrollo: http://192.168.1.130:3001/api
 * En producción: Cambiar por URL del servidor Ubuntu
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://192.168.1.131:3001/api',  // ← Tu IP
  headers: {
    'Content-Type': 'application/json'
  }
});

// BLOQUE 3: Interceptor JWT

/**
 * Interceptor de peticiones
 * 
 * Se ejecuta ANTES de cada petición HTTP
 * Lee el token de localStorage y lo añade al header Authorization
 * 
 * Flujo:
 * 1. Usuario hace login → token guardado en localStorage
 * 2. Cualquier petición → interceptor lee localStorage
 * 3. Si hay token → añade "Authorization: Bearer <token>"
 * 4. Petición sale con JWT incluido
 */
apiClient.interceptors.request.use(
  (config) => {
    // Leer token de localStorage
    const token = localStorage.getItem('token');
    
    // Si existe token, añadir al header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Si hay error antes de enviar la petición
    return Promise.reject(error);
  }
);


// BLOQUE 4: Funciones de Autenticación

/**
 * Registro de nuevo usuario
 * 
 * @param email - Email único del usuario
 * @param password - Contraseña (mínimo 6 caracteres)
 * @param name - Nombre completo
 * @returns Promise con mensaje de éxito
 */
export const register = async (
  email: string,
  password: string,
  name: string
): Promise<{ message: string }> => {
  const { data } = await apiClient.post('/auth/register', {
    email,
    password,
    name
  });
  return data;
};

/**
 * Login de usuario existente
 * 
 * @param email - Email del usuario
 * @param password - Contraseña
 * @returns Token JWT y datos del usuario
 * 
 * IMPORTANTE: El componente debe guardar el token:
 * localStorage.setItem('token', data.token)
 */
export const login = async (
  email: string,
  password: string
): Promise<{ token: string; user: User }> => {
  const { data } = await apiClient.post('/auth/login', {
    email,
    password
  });
  return data;
};


// BLOQUE 5: Funciones de Preguntas

/**
 * Obtener preguntas filtradas
 * 
 * @param params - Filtros de búsqueda
 * @param params.subjectCode - Código de asignatura (ej: "DWEC")
 * @param params.topicNumber - Número de tema (opcional)
 * @param params.type - Tipo de test: "tema" | "final" | "failed"
 * @param params.limit - Cantidad de preguntas (default: 20)
 * @returns Array de preguntas SIN correctAnswer
 */
export const getQuestions = async (params: {
  subjectCode: string;
  topicNumber?: number;
  type?: 'tema' | 'final' | 'failed';
  limit?: number;
}): Promise<Question[]> => {
  const { data } = await apiClient.get('/questions', { params });
  return data;
};

/**
 * Contar preguntas disponibles
 * 
 * @param params - Filtros de búsqueda
 * @returns Objeto con count y parámetros usados
 * 
 * Uso: Para mostrar botones dinámicos [10] [20] [MAX(28)]
 */
export const getQuestionsCount = async (params: {
  subjectCode: string;
  topicNumber?: number;
  type?: 'tema' | 'final' | 'failed';
}): Promise<{ count: number; subjectCode: string; topicNumber: number | null; type: string }> => {
  const { data } = await apiClient.get('/questions/count', { params });
  return data;
};


// BLOQUE 6: Funciones de Attempts y Stats

/**
 * Enviar intento de test completo
 * 
 * @param attemptData - Datos del intento
 * @param attemptData.subjectCode - Código de asignatura
 * @param attemptData.topicNumber - Número de tema (null para test final)
 * @param attemptData.answers - Array de respuestas del usuario
 * @returns Resultado con score, respuestas correctas/incorrectas y explicaciones
 */
export const submitAttempt = async (attemptData: {
  subjectCode: string;
  topicNumber: number | null;
  answers: Answer[];
}): Promise<AttemptResult> => {
  const { data } = await apiClient.post('/attempts', attemptData);
  return data;
};

/**
 * Obtener estadísticas del usuario autenticado
 * 
 * @returns Stats con agregaciones por asignatura/tema y contador de falladas
 * 
 * NOTA: El userId se extrae del JWT en el backend (no hace falta enviarlo)
 */
export const getStats = async (): Promise<Stats> => {
  const { data } = await apiClient.get('/attempts/stats');
  return data;
};


// BLOQUE 7: Funciones de Subjects (Asignaturas)

/**
 * Obtener lista de asignaturas con contador de preguntas
 * 
 * @returns Array de asignaturas únicas con subjectCode, subjectName y questionCount
 */
export const getSubjects = async (): Promise<{
  subjectCode: string;
  subjectName: string;
  questionCount: number;
}[]> => {
  const { data } = await apiClient.get('/subjects');
  return data;
};

/**
 * Obtener temas de una asignatura con contador de preguntas
 * 
 * @param subjectCode - Código de asignatura (ej: "DWEC")
 * @returns Array de temas con topicNumber, topicTitle y questionCount
 */
export const getTopicsBySubject = async (subjectCode: string): Promise<{
  topicNumber: number;
  topicTitle: string;
  questionCount: number;
}[]> => {
  const { data } = await apiClient.get(`/subjects/${subjectCode}/topics`);
  return data;
};

export { apiClient };

