import { useState, type SyntheticEvent } from 'react';
import { useAuth } from './AuthProvider';

export function LoginForm() {
  const { login } = useAuth();

  const [email, setEmail] = useState('resident@connected.local');
  const [password, setPassword] = useState('resident123');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      await login({ email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '4rem auto', padding: '2rem', border: '1px solid #ddd', borderRadius: 12 }}>
      <h1>Connexion</h1>
      <p>Authentification locale de développement</p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          required
        />

        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mot de passe"
          required
        />

        <button type="submit" disabled={isPending}>
          {isPending ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      {error && <p style={{ color: 'crimson', marginTop: '1rem' }}>{error}</p>}

      <div style={{ marginTop: '1rem', fontSize: '0.95rem' }}>
        <p><strong>Comptes de démonstration :</strong></p>
        <p>resident@connected.local / resident123</p>
        <p>moderator@connected.local / moderator123</p>
        <p>admin@connected.local / admin123</p>
      </div>
    </div>
  );
}