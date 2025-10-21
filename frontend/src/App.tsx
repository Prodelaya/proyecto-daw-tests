// ============================================
// APP PRINCIPAL - CONFIGURACIÓN DE RUTAS
// ============================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import { ThemeProvider } from './context/ThemeContext';

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard'; 
import SubjectDetail from './pages/SubjectDetail';  
import TestConfig from './pages/TestConfig';       
import TestView from './pages/TestView';            
import Results from './pages/Results';              
import Stats from './pages/Stats';    
import Ranking from './pages/Ranking';             

function App() {
  return (
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta Pública */}
          <Route path="/" element={<Login />} />

          {/* Rutas Protegidas */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/subject/:subjectCode"
            element={
              <PrivateRoute>
                <SubjectDetail />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/test/config"
            element={
              <PrivateRoute>
                <TestConfig />
              </PrivateRoute>
            }
          />

          <Route
            path="/test"
            element={
              <PrivateRoute>
                <TestView />
              </PrivateRoute>
            }
          />

          <Route
            path="/results"
            element={
              <PrivateRoute>
                <Results />
              </PrivateRoute>
            }
          />

          
          {
            <Route
              path="/stats"
              element={
                <PrivateRoute>
                  <Stats />
                </PrivateRoute>
              }
            />
          }

          
          <Route path="/ranking" element={<PrivateRoute><Ranking /></PrivateRoute>} />


          

          {/* Ruta 404 - Cualquier URL no definida */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider> 
  );
}

export default App;