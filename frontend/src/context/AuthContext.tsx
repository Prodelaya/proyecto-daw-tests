/* eslint-disable react-refresh/only-export-components */

// ============================================
// AUTH CONTEXT - GESTIÓN DE AUTENTICACIÓN
// ============================================

// BLOQUE 1: Imports

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login, register } from '../services/api';
import { User } from '../types';


// BLOQUE 2: Definir tipos del Context

/**
 * Interfaz que define qué expone el AuthContext
 * 
 * Propiedades:
 * - user: Usuario logueado o null si no hay sesión
 * - loading: Indica si está cargando datos de localStorage
 * 
 * Funciones:
 * - loginUser: Autenticar usuario existente
 * - registerUser: Registrar nuevo usuario + auto-login
 * - logoutUser: Cerrar sesión y limpiar datos
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginUser: (email: string, password: string) => Promise<void>;
  registerUser: (email: string, password: string, name: string) => Promise<void>;
  logoutUser: () => void;
}


// BLOQUE 3: Crear el Context

/**
 * Context de autenticación
 * 
 * Inicializado como undefined
 * Se llenará con valores reales en el AuthProvider
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);


// BLOQUE 4: AuthProvider Component

/**
 * Provider del contexto de autenticación
 * 
 * Responsabilidades:
 * - Mantener estado global de user y loading
 * - Leer localStorage al montar (persistencia)
 * - Proporcionar funciones login/register/logout
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Estado: usuario actual
  const [user, setUser] = useState<User | null>(null);
  
  // Estado: indica si está cargando datos iniciales
  const [loading, setLoading] = useState<boolean>(true);


  // useEffect: Ejecutar al montar el componente
  useEffect(() => {
    /**
     * Verificar si hay sesión guardada en localStorage
     * 
     * Flujo:
     * 1. Leer token de localStorage
     * 2. Si existe, leer datos del usuario
     * 3. Parsear JSON y actualizar estado
     * 4. Marcar loading como false
     */
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          const userData = JSON.parse(userStr);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error al leer datos de autenticación:', error);
        // Si hay error parseando, limpiar localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        // Siempre marcar loading como false al terminar
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []); // Array vacío = solo ejecutar al montar

  /**
   * Autenticar usuario existente
   * 
   * Flujo:
   * 1. Llamar servicio API login()
   * 2. Guardar token en localStorage (interceptor lo usará)
   * 3. Guardar datos usuario en localStorage (persistencia)
   * 4. Actualizar estado user
   * 
   * @throws Error si credenciales incorrectas
   */
  const loginUser = async (email: string, password: string): Promise<void> => {
    const response = await login(email, password);
    
    // Guardar token (interceptor axios lo leerá en cada petición)
    localStorage.setItem('token', response.token);
    
    // Guardar usuario (para persistencia tras refresh)
    localStorage.setItem('user', JSON.stringify(response.user));
    
    // Actualizar estado
    setUser(response.user);
  };


  /**
   * Registrar nuevo usuario
   * 
   * Flujo:
   * 1. Llamar servicio API register()
   * 2. Hacer auto-login (llama a loginUser)
   * 
   * @throws Error si email ya existe o datos inválidos
   */
  const registerUser = async (
    email: string,
    password: string,
    name: string
  ): Promise<void> => {
    // Registrar usuario en backend
    await register(email, password, name);
    
    // Auto-login tras registro exitoso
    await loginUser(email, password);
  };


  /**
   * Cerrar sesión
   * 
   * Flujo:
   * 1. Limpiar token de localStorage
   * 2. Limpiar datos usuario de localStorage
   * 3. Resetear estado user a null
   */
  const logoutUser = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };


  // Retornar Provider con valores
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginUser,
        registerUser,
        logoutUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


// BLOQUE 5: Hook personalizado para usar el Context

/**
 * Hook para acceder al AuthContext
 * 
 * Uso en componentes:
 * const { user, loginUser, logoutUser } = useAuth();
 * 
 * @throws Error si se usa fuera de AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  
  return context;
};

