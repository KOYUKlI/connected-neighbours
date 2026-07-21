import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getHome, type HomeResponse, type HomeTodoItem } from '../api/home';
import { useAuth } from '../auth/useAuth';
import { PageContainer } from '../components/layout/PageContainer';
import { ServiceCard } from '../components/services/ServiceCard';
import { Badge } from '../components/ui/Badge';
import { buttonStyles } from '../components/ui/buttonStyles';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Icon, type IconName } from '../components/ui/Icon';
import { LoadingState } from '../components/ui/LoadingState';
import { PointsSummary } from '../components/ui/PointsSummary';
import { getFriendlyError } from '../utils/errors';
import { getEntityId } from '../utils/format';

const todoPresentation: Record<
  HomeTodoItem['type'],
  { icon: IconName; label: string; detail: string }
> = {
  compare_applications: {
    icon: 'users',
    label: 'Des candidatures sont à comparer',
    detail: 'Consultez les profils avant de choisir un voisin.',
  },
  sign_contract: {
    icon: 'contract',
    label: 'Un contrat attend votre signature',
    detail: 'Relisez les conditions avant de signer.',
  },
  follow_active_contract: {
    icon: 'check',
    label: 'Un service est en cours',
    detail: 'Suivez sa réalisation depuis le service concerné.',
  },
};

export function HomePage() {
  const { user } = useAuth();
  const [data, setData] = useState<HomeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await getHome());
    } catch (caught) {
      setError(
        getFriendlyError(
          caught,
          'Impossible de charger votre accueil. Réessayez dans quelques instants.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <PageContainer>
        <LoadingState message="Préparation de votre quartier…" />
      </PageContainer>
    );
  }

  if (error || !data || !user) {
    return (
      <PageContainer>
        <ErrorMessage message={error ?? 'Impossible de préparer votre accueil.'} />
      </PageContainer>
    );
  }

  const neighborhoodLabel = data.profile.neighborhood
    ? [data.profile.neighborhood.name, data.profile.neighborhood.city]
        .filter(Boolean)
        .join(', ')
    : 'Votre quartier';
  const recentIncident = data.recentIncidents[0];
  const balance = {
    userId: user.id,
    availablePoints: data.points.availablePoints,
    reservedPoints: data.points.reservedPoints,
    pointsBalance: data.points.availablePoints + data.points.reservedPoints,
  };

  return (
    <PageContainer className="grid gap-8">
      <section className="flex flex-col gap-5 rounded-xl bg-emerald-900 px-5 py-7 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <p className="text-sm font-semibold text-emerald-200">{neighborhoodLabel}</p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
            Bonjour {data.profile.displayName?.split(' ')[0] ?? 'voisin'}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-100">
            Retrouvez ce qui demande votre attention et les services disponibles près de chez vous.
          </p>
        </div>
        <Link
          className={buttonStyles(
            'primary',
            'md',
            'border-white bg-white text-emerald-900 hover:border-emerald-50 hover:bg-emerald-50',
          )}
          to="/services/new"
        >
          <Icon className="size-4" name="plus" /> Publier un service
        </Link>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.7fr)]">
        <div className="grid gap-8">
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-950">À faire</h2>
                <p className="mt-1 text-sm text-slate-600">Vos prochaines actions importantes.</p>
              </div>
              <Link className="text-sm font-bold text-emerald-700 hover:text-emerald-900" to="/activities">
                Tout voir
              </Link>
            </div>
            {data.todoItems.length > 0 ? (
              <div className="grid gap-3">
                {data.todoItems.map((task, index) => {
                  const presentation = todoPresentation[task.type];
                  const to = task.type === 'sign_contract' && task.contractId
                    ? '/app/contracts'
                    : `/services/${task.serviceId}`;
                  return (
                    <Link
                      className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                      key={`${task.type}-${task.serviceId}-${index}`}
                      to={to}
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                        <Icon className="size-5" name={presentation.icon} />
                      </span>
                      <span className="min-w-0">
                        <strong className="block text-sm text-slate-950">
                          {presentation.label}
                        </strong>
                        <span className="mt-0.5 block truncate text-sm text-slate-600">
                          {task.serviceTitle ?? presentation.detail}
                          {task.count ? ` · ${task.count} candidature${task.count > 1 ? 's' : ''}` : ''}
                        </span>
                      </span>
                      <span className="ml-auto text-emerald-700">→</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                message="Aucune action urgente. Profitez-en pour découvrir les demandes de votre quartier."
                title="Vous êtes à jour"
              />
            )}
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-950">Services près de chez vous</h2>
                <p className="mt-1 text-sm text-slate-600">Des demandes et offres publiées dans votre quartier.</p>
              </div>
              <Link className="text-sm font-bold text-emerald-700 hover:text-emerald-900" to="/services">
                Explorer
              </Link>
            </div>
            {data.recentServices.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.recentServices.slice(0, 3).map((service) => (
                  <ServiceCard
                    currentUserId={user.id}
                    key={getEntityId(service)}
                    neighborhoods={[]}
                    service={service}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                action={
                  <Link className={buttonStyles('secondary', 'sm')} to="/services/new">
                    Publier une annonce
                  </Link>
                }
                message="Aucun service publié n’est disponible pour le moment."
                title="Soyez le premier à proposer un service"
              />
            )}
          </section>
        </div>

        <aside className="grid content-start gap-4">
          <PointsSummary balance={balance} />
          <Card>
            <h2 className="font-extrabold text-slate-950">Dans votre quartier</h2>
            {recentIncident ? (
              <div className="mt-3">
                <Badge tone={recentIncident.status === 'resolved' ? 'success' : 'warning'}>
                  {recentIncident.status === 'resolved' ? 'Résolu' : 'Suivi en cours'}
                </Badge>
                <p className="mt-2 text-sm font-bold text-slate-900">{recentIncident.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Les incidents sont visibles par les habitants et suivis par l’administration.
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-600">Aucune actualité locale n’est disponible.</p>
            )}
            <Link className="mt-4 inline-flex text-sm font-bold text-emerald-700 hover:text-emerald-900" to="/local">
              Voir la vie locale
            </Link>
          </Card>
          <Card>
            <h2 className="font-extrabold text-slate-950">Voisins à découvrir</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Les profils publics seront proposés dans le prochain lot. Vos données privées ne sont jamais affichées ici.
            </p>
            <Link className="mt-3 inline-flex text-sm font-bold text-emerald-700 hover:text-emerald-900" to="/neighbors">
              Découvrir bientôt
            </Link>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}
