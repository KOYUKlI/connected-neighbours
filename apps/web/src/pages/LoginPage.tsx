import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/useAuth';
import { ApiError } from '../api/client';
import { Button } from '../components/ui/Button';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Icon } from '../components/ui/Icon';
import { Input } from '../components/ui/Input';
import { getFriendlyError } from '../utils/errors';

type LoginLocationState = { from?: { pathname?: string } };

export function LoginPage() {
  const { isReady, login, sessionMessage, user } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!isReady) {
    return <div className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-600">Vérification de votre session…</div>;
  }
  if (user) return <Navigate replace to="/" />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await login({ email, password }, remember);
      const state = location.state as LoginLocationState | null;
      navigate(state?.from?.pathname ?? '/', { replace: true });
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.status === 401
          ? 'Email ou mot de passe incorrect. Vérifiez vos informations.'
          : getFriendlyError(caught, 'Impossible de vous connecter. Réessayez dans quelques instants.'),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(32rem,1.1fr)]">
      <aside className="hidden bg-emerald-900 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-lg bg-white text-sm font-black text-emerald-900">CN</span>
          <strong className="text-lg leading-tight">Connected<br />Neighbours</strong>
        </div>
        <div className="max-w-xl">
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-200">Votre quartier, simplement</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight xl:text-5xl">L’entraide locale commence à quelques rues de chez vous.</h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-emerald-100">Trouvez un coup de main, partagez vos compétences et participez à la vie de votre quartier dans un espace de confiance.</p>
          <ul className="mt-8 grid gap-4 text-sm text-emerald-50">
            <li className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-white/10"><Icon className="size-4" name="services" /></span>Des services entre voisins, gratuits ou en points</li>
            <li className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-white/10"><Icon className="size-4" name="users" /></span>Une communauté rattachée à votre quartier</li>
            <li className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-white/10"><Icon className="size-4" name="contract" /></span>Un suivi clair des candidatures et contrats</li>
          </ul>
        </div>
        <p className="text-xs text-emerald-200">Connected Neighbours</p>
      </aside>

      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-emerald-800 text-xs font-black text-white">CN</span>
            <strong className="text-base leading-tight text-slate-950">Connected Neighbours</strong>
          </div>
          <div className="mb-7">
            <p className="text-sm font-bold text-emerald-700">Bienvenue dans votre quartier</p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">{mode === 'login' ? 'Connectez-vous' : 'Créer un compte'}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{mode === 'login' ? 'Retrouvez vos services, contrats et points.' : 'Rejoignez votre quartier pour commencer à échanger.'}</p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Accès au compte">
            <button aria-selected={mode === 'login'} className={`min-h-11 rounded-md px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${mode === 'login' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`} onClick={() => setMode('login')} role="tab" type="button">Connexion</button>
            <button aria-selected={mode === 'register'} className={`min-h-11 rounded-md px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${mode === 'register' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`} onClick={() => setMode('register')} role="tab" type="button">Créer un compte</button>
          </div>

          {mode === 'login' ? (
            <form className="grid gap-5" onSubmit={handleSubmit}>
              {sessionMessage ? <ErrorMessage message={sessionMessage} /> : null}
              {error ? <ErrorMessage message={error} /> : null}
              <label className="grid gap-2 text-sm font-bold text-slate-900">Adresse email<Input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="prenom.nom@exemple.fr" required type="email" value={email} /></label>
              <label className="grid gap-2 text-sm font-bold text-slate-900">Mot de passe<Input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} placeholder="Votre mot de passe" required type="password" value={password} /></label>
              <div className="flex items-center justify-between gap-4 text-sm">
                <label className="flex min-h-11 cursor-pointer items-center gap-2 text-slate-600"><input checked={remember} className="size-4 rounded border-slate-300 accent-emerald-700" onChange={(event) => setRemember(event.target.checked)} type="checkbox" />Rester connecté</label>
                <span className="text-right font-semibold text-slate-500">Mot de passe oublié ?</span>
              </div>
              <Button className="w-full" disabled={pending} type="submit" variant="primary">{pending ? 'Connexion en cours…' : 'Se connecter'}</Button>
            </form>
          ) : (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
              <h3 className="font-bold text-blue-950">Création de compte bientôt disponible</h3>
              <p className="mt-2 text-sm leading-6 text-blue-800">L’API actuelle ne permet pas encore de créer un compte. Aucun faux profil ne sera enregistré dans votre navigateur.</p>
              <Button className="mt-4" onClick={() => setMode('login')} variant="secondary">Revenir à la connexion</Button>
            </div>
          )}
          <p className="mt-8 text-center text-xs leading-5 text-slate-500">En vous connectant, vous accédez uniquement aux informations de votre compte et de votre quartier.</p>
        </div>
      </section>
    </main>
  );
}
