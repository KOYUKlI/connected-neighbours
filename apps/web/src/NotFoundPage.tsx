import { Link } from 'react-router-dom';

import './NotFoundPage.css';

export function NotFoundPage() {
  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <p className="not-found-code">404</p>
        <h1>Page introuvable</h1>
        <p>Cette page n’existe pas ou plus.</p>
        <Link className="not-found-cta" to="/">
          Retour à l’accueil
        </Link>
      </div>
    </div>
  );
}
