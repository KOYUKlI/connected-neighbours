import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { ApiError } from '../api/client';
import { useAuth } from '../auth/useAuth';
import { Button } from '../components/ui/Button';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Icon } from '../components/ui/Icon';
import { Input } from '../components/ui/Input';
import { getFriendlyError } from '../utils/errors';

type LoginLocationState = { from?: { pathname?: string } };
type LocalMode = 'login' | 'register';

export function LoginPage() {
  const {
    authMode,
    isReady,
    linkExistingAccount,
    linkRequired,
    login,
    loginWithKeycloak,
    registerWithKeycloak,
    sessionMessage,
    user,
  } = useAuth();
  const [mode, setMode] = useState<LocalMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  if (!isReady) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-600">
        Vérification de votre session…
      </div>
    );
  }
  if (user) return <Navigate replace to="/" />;

  async function handleLocalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending('local');
    setError(null);
    try {
      await login({ email, password }, remember);
      navigate(getReturnPath(), { replace: true });
    } catch (caught) {
      setError(loginFailure(caught));
    } finally {
      setPending(null);
    }
  }

  async function handleLinkSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending('link');
    setError(null);
    try {
      await linkExistingAccount({ email, password });
      navigate('/', { replace: true });
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.status === 401
          ? 'Les identifiants du compte local sont incorrects.'
          : getFriendlyError(
              caught,
              'Impossible de lier les deux identités pour le moment.',
            ),
      );
    } finally {
      setPending(null);
    }
  }

  async function handleKeycloak(action: 'login' | 'register') {
    setPending(action);
    setError(null);
    try {
      if (action === 'register') {
        await registerWithKeycloak();
      } else {
        await loginWithKeycloak(getReturnPath());
      }
    } catch (caught) {
      setError(
        getFriendlyError(caught, 'Le service de connexion est indisponible.'),
      );
      setPending(null);
    }
  }

  function getReturnPath() {
    const state = location.state as LoginLocationState | null;
    return state?.from?.pathname ?? '/';
  }

  const title = linkRequired
    ? 'Lier votre compte existant'
    : authMode === 'keycloak'
      ? 'Connectez-vous'
      : mode === 'login'
        ? 'Connectez-vous'
        : 'Créer un compte';

  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(32rem,1.1fr)]">
      <aside className="hidden bg-emerald-900 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-lg bg-white text-sm font-black text-emerald-900">
            CN
          </span>
          <strong className="text-lg leading-tight">
            Connected
            <br />
            Neighbours
          </strong>
        </div>
        <div className="max-w-xl">
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-200">
            Votre quartier, simplement
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight xl:text-5xl">
            L’entraide locale commence à quelques rues de chez vous.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-emerald-100">
            Trouvez un coup de main, partagez vos compétences et participez à la
            vie de votre quartier dans un espace de confiance.
          </p>
          <ul className="mt-8 grid gap-4 text-sm text-emerald-50">
            <Feature icon="services">Des services entre voisins</Feature>
            <Feature icon="users">Une communauté rattachée à votre quartier</Feature>
            <Feature icon="contract">Un suivi clair des contrats</Feature>
          </ul>
        </div>
        <p className="text-xs text-emerald-200">Connected Neighbours</p>
      </aside>

      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-emerald-800 text-xs font-black text-white">
              CN
            </span>
            <strong className="text-base leading-tight text-slate-950">
              Connected Neighbours
            </strong>
          </div>
          <div className="mb-7">
            <p className="text-sm font-bold text-emerald-700">
              Bienvenue dans votre quartier
            </p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {linkRequired
                ? 'Confirmez une fois les identifiants de votre compte local. Aucun compte ne sera fusionné automatiquement.'
                : 'Retrouvez vos services, contrats et points.'}
            </p>
          </div>

          {sessionMessage ? <ErrorMessage message={sessionMessage} /> : null}
          {error ? <div className="mt-4"><ErrorMessage message={error} /></div> : null}

          {linkRequired ? (
            <form className="mt-6 grid gap-5" onSubmit={handleLinkSubmit}>
              <CredentialFields
                email={email}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
                password={password}
              />
              <Button
                className="w-full"
                disabled={pending === 'link'}
                type="submit"
                variant="primary"
              >
                {pending === 'link' ? 'Liaison en cours…' : 'Confirmer et lier les comptes'}
              </Button>
            </form>
          ) : authMode === 'keycloak' ? (
            <div className="mt-6 grid gap-4">
              <Button
                className="w-full"
                disabled={pending !== null}
                onClick={() => void handleKeycloak('login')}
                variant="primary"
              >
                {pending === 'login' ? 'Redirection…' : 'Se connecter en toute sécurité'}
              </Button>
              <Button
                className="w-full"
                disabled={pending !== null}
                onClick={() => void handleKeycloak('register')}
                variant="secondary"
              >
                Créer un compte
              </Button>
              <p className="text-center text-xs leading-5 text-slate-500">
                La connexion s’ouvre sur le service d’identité. Le mot de passe
                n’est jamais transmis à Connected Neighbours.
              </p>
            </div>
          ) : (
            <LocalLogin
              email={email}
              mode={mode}
              onEmailChange={setEmail}
              onModeChange={setMode}
              onPasswordChange={setPassword}
              onRememberChange={setRemember}
              onSubmit={handleLocalSubmit}
              password={password}
              pending={pending === 'local'}
              remember={remember}
            />
          )}
        </div>
      </section>
    </main>
  );
}

function LocalLogin({
  email,
  mode,
  onEmailChange,
  onModeChange,
  onPasswordChange,
  onRememberChange,
  onSubmit,
  password,
  pending,
  remember,
}: {
  email: string;
  mode: LocalMode;
  onEmailChange: (value: string) => void;
  onModeChange: (value: LocalMode) => void;
  onPasswordChange: (value: string) => void;
  onRememberChange: (value: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  password: string;
  pending: boolean;
  remember: boolean;
}) {
  return (
    <>
      <div
        aria-label="Accès au compte"
        className="mb-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1"
        role="tablist"
      >
        {(['login', 'register'] as const).map((value) => (
          <button
            aria-selected={mode === value}
            className={`min-h-11 rounded-md px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${mode === value ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            key={value}
            onClick={() => onModeChange(value)}
            role="tab"
            type="button"
          >
            {value === 'login' ? 'Connexion' : 'Créer un compte'}
          </button>
        ))}
      </div>
      {mode === 'login' ? (
        <form className="grid gap-5" onSubmit={onSubmit}>
          <CredentialFields
            email={email}
            onEmailChange={onEmailChange}
            onPasswordChange={onPasswordChange}
            password={password}
          />
          <div className="flex items-center justify-between gap-4 text-sm">
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-slate-600">
              <input
                checked={remember}
                className="size-4 rounded border-slate-300 accent-emerald-700"
                onChange={(event) => onRememberChange(event.target.checked)}
                type="checkbox"
              />
              Rester connecté
            </label>
            <span className="text-right font-semibold text-slate-500">
              Mot de passe oublié ?
            </span>
          </div>
          <Button className="w-full" disabled={pending} type="submit" variant="primary">
            {pending ? 'Connexion en cours…' : 'Se connecter'}
          </Button>
        </form>
      ) : (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
          <h3 className="font-bold text-blue-950">Création de compte indisponible</h3>
          <p className="mt-2 text-sm leading-6 text-blue-800">
            La création locale n’est pas activée. Aucun faux profil ne sera
            enregistré dans votre navigateur.
          </p>
          <Button className="mt-4" onClick={() => onModeChange('login')} variant="secondary">
            Revenir à la connexion
          </Button>
        </div>
      )}
    </>
  );
}

function CredentialFields({
  email,
  onEmailChange,
  onPasswordChange,
  password,
}: {
  email: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  password: string;
}) {
  return (
    <>
      <label className="grid gap-2 text-sm font-bold text-slate-900">
        Adresse email
        <Input
          autoComplete="email"
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="prenom.nom@exemple.fr"
          required
          type="email"
          value={email}
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-900">
        Mot de passe
        <Input
          autoComplete="current-password"
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="Votre mot de passe"
          required
          type="password"
          value={password}
        />
      </label>
    </>
  );
}

function Feature({ children, icon }: { children: string; icon: 'services' | 'users' | 'contract' }) {
  return (
    <li className="flex items-center gap-3">
      <span className="grid size-8 place-items-center rounded-full bg-white/10">
        <Icon className="size-4" name={icon} />
      </span>
      {children}
    </li>
  );
}

function loginFailure(error: unknown) {
  return error instanceof ApiError && error.status === 401
    ? 'Email ou mot de passe incorrect. Vérifiez vos informations.'
    : getFriendlyError(
        error,
        'Impossible de vous connecter. Réessayez dans quelques instants.',
      );
}