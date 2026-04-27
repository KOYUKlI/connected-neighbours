import { LoginForm } from './auth/LoginForm';
import { useAuth } from './auth/useAuth';
import { ServicesScreen } from './services/ServicesScreen';

export default function App() {
  const { isReady, user } = useAuth();

  if (!isReady) {
    return <p style={{ padding: '2rem' }}>Initialisation...</p>;
  }

  if (!user) {
    return <LoginForm />;
  }

  return <ServicesScreen />;
}
