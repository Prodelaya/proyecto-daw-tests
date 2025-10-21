/* eslint-disable react-refresh/only-export-components */

// ============================================
// THEME CONTEXT - GESTIÓN DE DARK MODE
// ============================================

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Interfaz del Context
interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

// Crear Context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Estado: leer localStorage o default false
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  // useEffect: Aplicar clase 'dark' al <html> y guardar en localStorage
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // Toggle función
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook personalizado
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
};