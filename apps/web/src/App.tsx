import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';

import { AuthProvider } from './auth/AuthProvider';
import { useAuth } from './auth/useAuth';
import { AppShell } from './components/layout/AppShell';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ServiceCreatePage } from './pages/ServiceCreatePage';
import { ServiceDetailPage } from './pages/ServiceDetailPage';
import { ServicesExplorePage } from './pages/ServicesExplorePage';

function ProtectedLayout() {
  const { isReady, user } = useAuth();
  const location = useLocation();

  if (!isReady) return <div className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-600">Vérification de votre session…</div>;
  if (!user) return <Navigate replace state={{ from: location }} to="/login" />;

  return <AppShell><Outlet /></AppShell>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<LoginPage />} path="/login" />
      <Route element={<ProtectedLayout />}>
        <Route element={<HomePage />} index />
        <Route element={<ServicesExplorePage />} path="services" />
        <Route element={<ServiceCreatePage />} path="services/new" />
        <Route element={<ServiceDetailPage />} path="services/:serviceId" />
        <Route element={<ComingSoonPage description="Découvrez bientôt les profils publics des habitants de votre quartier." icon="users" title="Voisins" />} path="neighbors" />
        <Route element={<ComingSoonPage description="Vos candidatures, contrats et actions personnelles seront regroupés ici." icon="activity" title="Mes activités" />} path="activities" />
        <Route element={<ComingSoonPage description="Événements, votes et incidents seront réunis dans cet espace." icon="map-pin" title="Vie locale" />} path="local" />
        <Route element={<ComingSoonPage description="La messagerie persistante sera intégrée dans un lot dédié." icon="message" title="Messages" />} path="messages" />
        <Route element={<ComingSoonPage description="La gestion détaillée du compte, des points et de la confidentialité arrive prochainement." icon="user" title="Mon profil" />} path="profile" />
        <Route element={<NotFoundPage />} path="*" />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
