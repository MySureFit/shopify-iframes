import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FittingRoomProvider } from './context/FittingRoomContext';

// Iframe routes (new architecture)
import ProductsIframe    from './iframes/ProductsIframe';
import ModelsIframe      from './iframes/ModelsIframe';
import FittingRoomIframe from './iframes/FittingRoomIframe';

// Legacy standalone routes (kept for direct access / testing)
import NavBar          from './components/NavBar';
import LoginPage       from './pages/LoginPage';
import CollectionPage  from './pages/CollectionPage';
import FittingRoomPage from './pages/FittingRoomPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function Layout() {
  const { isAuthenticated, sessionReady } = useAuth();
  const { pathname } = useLocation();
  const isIframe = pathname.startsWith('/iframe/');

  // Wait for session/create to complete before rendering any iframe
  if (!sessionReady) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <>
      {isAuthenticated && !isIframe && <NavBar />}
      <Routes>
        {/* ── Iframe routes — no navbar, designed for embedding ── */}
        <Route path="/iframe/products"     element={<ProductsIframe />} />
        <Route path="/iframe/models"       element={<ModelsIframe />} />
        <Route path="/iframe/fitting-room" element={<FittingRoomIframe />} />

        {/* ── Legacy standalone routes ── */}
        <Route path="/login"        element={<LoginPage />} />
        <Route path="/"             element={<ProtectedRoute><CollectionPage /></ProtectedRoute>} />
        <Route path="/fitting-room" element={<ProtectedRoute><FittingRoomPage /></ProtectedRoute>} />
        <Route path="*"             element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FittingRoomProvider>
          <Layout />
        </FittingRoomProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
