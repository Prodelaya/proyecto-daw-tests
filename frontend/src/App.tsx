// ============================================
// APP PRINCIPAL - PUNTO DE ENTRADA
// ============================================

import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';

function App() {
  return (
    <AuthProvider>
      <Login />
    </AuthProvider>
  );
}

export default App;

