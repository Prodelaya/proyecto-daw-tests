// ============================================
// APP PRINCIPAL - CONFIGURACIÓN DE RUTAS
// ============================================

// BLOQUE 1: Imports

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';


// BLOQUE 2: Componente App

/**
 * Componente raíz de la aplicación
 * 
 * Arquitectura:
 * - AuthProvider: Proporciona contexto de autenticación a toda la app
 * - BrowserRouter: Habilita navegación con URLs limpias
 * - Routes: Contenedor de rutas
 * - Route: Define cada ruta individual
 * - PrivateRoute: Protege rutas que requieren autenticación
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública: Login */}
          <Route path="/" element={<Login />} />

          {/* Ruta protegida: Dashboard */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;