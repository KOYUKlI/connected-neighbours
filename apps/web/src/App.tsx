import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from './auth/useAuth';
import { AppShell } from './components/layout/AppShell';
import { ChatWidget } from './features/messaging/ChatWidget';

export default function App() {
  const { isReady, user } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-600">
        Vérification de votre session…
      </div>
    );
  }

  if (!user) return <Navigate replace state={{ from: location }} to="/login" />;

  return (
    <AppShell>
      <Outlet />
      <ChatWidget />
    </AppShell>
  );
}
