import { Link } from 'react-router-dom';

import { PageContainer } from '../components/layout/PageContainer';
import { buttonStyles } from '../components/ui/buttonStyles';

export function NotFoundPage() {
  return (
    <PageContainer className="grid min-h-[60vh] place-items-center text-center">
      <div><p className="text-sm font-bold text-emerald-700">Erreur 404</p><h1 className="mt-2 text-3xl font-extrabold text-slate-950">Cette page n’existe pas</h1><p className="mt-3 text-slate-600">Le lien est peut-être incomplet ou la page a été déplacée.</p><Link className={buttonStyles('primary', 'md', 'mt-6')} to="/">Retour à l’accueil</Link></div>
    </PageContainer>
  );
}
