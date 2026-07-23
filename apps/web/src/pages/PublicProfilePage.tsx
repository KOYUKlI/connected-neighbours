import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getPublicProfile, type PublicProfile } from '../api/profiles';
import { PageContainer } from '../components/layout/PageContainer';
import { Avatar } from '../components/profiles/Avatar';
import { ReputationSummary } from '../components/reviews/ReputationSummary';
import { ReviewCard } from '../components/reviews/ReviewCard';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { LoadingState } from '../components/ui/LoadingState';
import { getFriendlyError } from '../utils/errors';

export function PublicProfilePage() {
  const { userId = '' } = useParams();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getPublicProfile(userId)
      .then((value) => {
        if (!ignore) setProfile(value);
      })
      .catch((caught) => {
        if (!ignore) setError(getFriendlyError(caught, 'Impossible de charger ce profil.'));
      });
    return () => {
      ignore = true;
    };
  }, [userId]);

  if (!profile && !error) {
    return <PageContainer><LoadingState message="Chargement du profil…" /></PageContainer>;
  }

  return (
    <PageContainer className="grid gap-6">
      <Link className="text-sm font-bold text-emerald-700 hover:text-emerald-900" to="/services">← Retour</Link>
      {error ? <ErrorMessage message={error} /> : null}
      {profile ? (
        <>
          <Card className="flex flex-wrap items-center gap-5">
            <Avatar className="size-24" name={profile.displayName} url={profile.avatarUrl} />
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-black text-slate-950">{profile.displayName}</h1>
              {profile.neighborhood ? (
                <p className="mt-2 text-sm text-slate-500">
                  {profile.neighborhood.name}, {profile.neighborhood.city}
                </p>
              ) : null}
              {profile.isRestricted ? (
                <Badge className="mt-3" tone="neutral">Profil privé</Badge>
              ) : null}
            </div>
          </Card>
          {profile.isRestricted ? (
            <EmptyState
              icon="user"
              message="Cette personne partage uniquement son identité publique minimale."
              title="Profil restreint"
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="grid content-start gap-6">
                <Card>
                  <h2 className="text-lg font-extrabold text-slate-950">À propos</h2>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{profile.bio || 'Aucune biographie renseignée.'}</p>
                  {profile.interests?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {profile.interests.map((interest) => <Badge key={interest} tone="success">{interest}</Badge>)}
                    </div>
                  ) : null}
                </Card>
                <section className="grid gap-3">
                  <h2 className="text-lg font-extrabold text-slate-950">Avis reçus</h2>
                  {profile.reviews?.items.length
                    ? profile.reviews.items.map((review) => <ReviewCard key={review.id} review={review} />)
                    : <Card><p className="text-sm text-slate-500">Aucun avis public pour le moment.</p></Card>}
                </section>
              </div>
              <div className="grid content-start gap-6">
                {profile.reputation ? (
                  <Card>
                    <h2 className="text-lg font-extrabold text-slate-950">Réputation</h2>
                    <div className="mt-4"><ReputationSummary reputation={profile.reputation} /></div>
                  </Card>
                ) : null}
                <Card>
                  <h2 className="text-lg font-extrabold text-slate-950">Services publics récents</h2>
                  <div className="mt-3 grid gap-3">
                    {profile.recentServices?.length ? profile.recentServices.map((service) => (
                      <Link className="rounded-lg border border-slate-200 p-3 text-sm hover:border-emerald-300" key={service.id} to={`/services/${service.id}`}>
                        <strong className="block text-slate-950">{service.title}</strong>
                        <span className="mt-1 block text-slate-500">{service.category}</span>
                      </Link>
                    )) : <p className="text-sm text-slate-500">Aucun service visible.</p>}
                  </div>
                </Card>
              </div>
            </div>
          )}
        </>
      ) : null}
    </PageContainer>
  );
}
