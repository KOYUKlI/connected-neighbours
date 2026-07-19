import { useDesktopLoginPage } from './hooks/useDesktopLoginPage';

export function DesktopLoginPage() {
  const { currentUser, isValidRequest, isPending, error, confirmed, onConfirm } =
    useDesktopLoginPage();

  if (!isValidRequest) {
    return (
      <main className="login-page">
        <section className="login-panel" aria-labelledby="desktop-login-title">
          <h1 id="desktop-login-title">Connexion impossible</h1>
          <p className="login-copy">
            Cette demande de connexion n’est pas valide. Relance-la depuis l’application
            Bureau.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="desktop-login-title">
        <div className="brand">
          <span className="brand-mark">CN</span>
          <div>
            <strong>Connected Neighbours</strong>
            <span>Connexion application Bureau</span>
          </div>
        </div>

        <div>
          <h1 id="desktop-login-title">Autoriser la connexion</h1>
          <p className="login-copy">
            L’application Bureau souhaite se connecter avec le compte{' '}
            <strong>{currentUser?.email}</strong>. Aucune donnée n’est partagée avec une
            autre application.
          </p>
        </div>

        {error ? <div className="error-banner compact">{error}</div> : null}

        {confirmed ? (
          <p className="login-copy">
            Connexion confirmée, tu peux retourner à l’application Bureau.
          </p>
        ) : (
          <button
            className="primary-button"
            disabled={isPending}
            onClick={() => void onConfirm()}
            type="button"
          >
            {isPending ? 'Confirmation...' : 'Confirmer'}
          </button>
        )}
      </section>
    </main>
  );
}
