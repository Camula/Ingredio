import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Fridge from './pages/Fridge';
import Recipes from './pages/Recipes';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import Pricing from './pages/Pricing';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ścieżki publiczne */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pricing" element={<Pricing />} />

          {/* Ścieżki z układem Layout */}
          <Route element={<Layout />}>
            {/* Strona główna (publiczna, ale w układzie Layout) */}
            <Route path="/" element={<Home />} />
            
            {/* Ścieżki chronione */}
            <Route element={<ProtectedRoute />}>
              <Route path="/fridge" element={<Fridge />} />
              <Route path="/recipes" element={<Recipes />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
