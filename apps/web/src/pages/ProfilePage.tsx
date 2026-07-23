import { useCallback, useEffect, useState, type FormEvent } from 'react';

import {
  deleteAvatar,
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  type OwnProfile,
} from '../api/profiles';
import { getMyReviews, type ReviewItem } from '../api/reviews';
import { useAuth } from '../auth/useAuth';
import { PageContainer } from '../components/layout/PageContainer';
import { Avatar } from '../components/profiles/Avatar';
import { ReputationSummary } from '../components/reviews/ReputationSummary';
import { ReviewCard } from '../components/reviews/ReviewCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Input } from '../components/ui/Input';
import { LoadingState } from '../components/ui/LoadingState';
import { Tabs } from '../components/ui/Tabs';
import { Textarea } from '../components/ui/Textarea';
import { getFriendlyError } from '../utils/errors';

type ProfileTab = 'account' | 'reviews' | 'privacy';

export function ProfilePage() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [received, setReceived] = useState<ReviewItem[]>([]);
  const [given, setGiven] = useState<ReviewItem[]>([]);
  const [tab, setTab] = useState<ProfileTab>('account');
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [nextProfile, nextReceived, nextGiven] = await Promise.all([
        getMyProfile(),
        getMyReviews('received'),
        getMyReviews('given'),
      ]);
      setProfile(nextProfile);
      setReceived(nextReceived.items);
      setGiven(nextGiven.items);
    } catch (caught) {
      setError(getFriendlyError(caught, 'Impossible de charger votre profil.'));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setPending('save');
    setError(null);
    setSuccess(null);
    try {
      const form = new FormData(event.currentTarget);
      const privacyForm = form.has('profileVisibility');
      const updated = await updateMyProfile({
        displayName: String(form.get('displayName') ?? ''),
        bio: String(form.get('bio') ?? ''),
        interests: String(form.get('interests') ?? '')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        profileVisibility: privacyForm
          ? form.get('profileVisibility') === 'private' ? 'private' : 'neighborhood'
          : profile.profileVisibility,
        showNeighborhood: privacyForm ? form.get('showNeighborhood') === 'on' : profile.showNeighborhood,
        showReviews: privacyForm ? form.get('showReviews') === 'on' : profile.showReviews,
        showCompletedServices: privacyForm ? form.get('showCompletedServices') === 'on' : profile.showCompletedServices,
        showReputation: privacyForm ? form.get('showReputation') === 'on' : profile.showReputation,
      });
      setProfile(updated);
      await refreshUser();
      setSuccess('Votre profil a été mis à jour.');
    } catch (caught) {
      setError(getFriendlyError(caught, 'Impossible de mettre à jour votre profil.'));
    } finally {
      setPending(null);
    }
  }

  async function changeAvatar(file?: File) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Utilisez une image JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('L’avatar doit peser moins de 5 Mio.');
      return;
    }
    setPending('avatar');
    setError(null);
    try {
      const updated = await uploadAvatar(file);
      setProfile(updated);
      await refreshUser();
      setSuccess('Votre avatar a été remplacé.');
    } catch (caught) {
      setError(getFriendlyError(caught, 'Impossible de remplacer votre avatar.'));
    } finally {
      setPending(null);
    }
  }

  async function removeAvatar() {
    setPending('avatar');
    setError(null);
    try {
      const updated = await deleteAvatar();
      setProfile(updated);
      await refreshUser();
      setSuccess('Votre avatar a été supprimé.');
    } catch (caught) {
      setError(getFriendlyError(caught, 'Impossible de supprimer votre avatar.'));
    } finally {
      setPending(null);
    }
  }

  function updateReview(updated: ReviewItem) {
    setReceived((items) =>
      items.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  if (!profile && !error) {
    return <PageContainer><LoadingState message="Chargement de votre profil…" /></PageContainer>;
  }

  return (
    <PageContainer className="grid gap-6">
      <header>
        <p className="text-sm font-bold text-emerald-700">Mon espace</p>
        <h1 className="mt-1 text-3xl font-black text-slate-950">Mon profil</h1>
        <p className="mt-2 text-sm text-slate-600">
          Choisissez ce que les habitants de votre quartier peuvent consulter.
        </p>
      </header>
      {error ? <ErrorMessage message={error} /> : null}
      {success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{success}</p>
      ) : null}
      {profile ? (
        <>
          <Card className="flex flex-wrap items-center gap-4">
            <Avatar className="size-20" name={profile.displayName} url={profile.avatarUrl} />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-extrabold text-slate-950">{profile.displayName}</h2>
              <p className="mt-1 text-sm text-slate-500">{profile.email}</p>
              <p className="mt-1 text-sm text-slate-500">
                {profile.neighborhood
                  ? `${profile.neighborhood.name}, ${profile.neighborhood.city}`
                  : 'Quartier non renseigné'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 focus-within:ring-4 focus-within:ring-emerald-200">
                {pending === 'avatar' ? 'Traitement…' : 'Changer l’avatar'}
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={pending === 'avatar'}
                  onChange={(event) => void changeAvatar(event.target.files?.[0])}
                  type="file"
                />
              </label>
              {profile.avatarUrl ? (
                <Button disabled={pending === 'avatar'} onClick={() => void removeAvatar()} variant="danger">
                  Supprimer
                </Button>
              ) : null}
            </div>
          </Card>

          <Tabs
            items={[
              { id: 'account', label: 'Mon compte' },
              { id: 'reviews', label: 'Avis et réputation', count: received.length },
              { id: 'privacy', label: 'Confidentialité' },
            ]}
            label="Sections du profil"
            onChange={setTab}
            value={tab}
          />

          {tab === 'account' ? (
            <form className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]" onSubmit={save}>
              <Card className="grid gap-4">
                <h2 className="text-lg font-extrabold text-slate-950">Informations publiques</h2>
                <label className="grid gap-2 text-sm font-bold text-slate-800">
                  Nom public
                  <Input defaultValue={profile.displayName} maxLength={120} name="displayName" required />
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-800">
                  Biographie
                  <Textarea defaultValue={profile.bio} maxLength={500} name="bio" rows={6} />
                  <span className="text-xs font-normal text-slate-500">500 caractères maximum.</span>
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-800">
                  Centres d’intérêt
                  <Input defaultValue={profile.interests.join(', ')} name="interests" placeholder="Bricolage, jardinage, informatique" />
                  <span className="text-xs font-normal text-slate-500">Séparez jusqu’à 12 éléments par une virgule.</span>
                </label>
                <Button className="w-fit" disabled={pending === 'save'} type="submit" variant="primary">
                  {pending === 'save' ? 'Enregistrement…' : 'Enregistrer'}
                </Button>
              </Card>
              <Card>
                <h2 className="text-lg font-extrabold text-slate-950">Votre réputation</h2>
                <div className="mt-4"><ReputationSummary reputation={profile.reputation} /></div>
              </Card>
            </form>
          ) : null}

          {tab === 'reviews' ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="grid content-start gap-3">
                <h2 className="text-lg font-extrabold text-slate-950">Avis reçus</h2>
                {received.length ? received.map((review) => (
                  <ReviewCard key={review.id} onUpdated={updateReview} review={review} />
                )) : <Card><p className="text-sm text-slate-500">Vous n’avez pas encore reçu d’avis.</p></Card>}
              </section>
              <section className="grid content-start gap-3">
                <h2 className="text-lg font-extrabold text-slate-950">Avis donnés</h2>
                {given.length ? given.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                )) : <Card><p className="text-sm text-slate-500">Vous n’avez pas encore publié d’avis.</p></Card>}
              </section>
            </div>
          ) : null}

          {tab === 'privacy' ? (
            <form className="grid gap-5" onSubmit={save}>
              <Card className="grid gap-4">
                <h2 className="text-lg font-extrabold text-slate-950">Visibilité du profil</h2>
                <label className="grid gap-2 text-sm font-bold text-slate-800">
                  Qui peut voir le profil enrichi ?
                  <select className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm" defaultValue={profile.profileVisibility} name="profileVisibility">
                    <option value="neighborhood">Les habitants de mon quartier</option>
                    <option value="private">Moi uniquement</option>
                  </select>
                </label>
                <input name="displayName" type="hidden" value={profile.displayName} />
                <input name="bio" type="hidden" value={profile.bio} />
                <input name="interests" type="hidden" value={profile.interests.join(', ')} />
                {[
                  ['showNeighborhood', 'Afficher mon quartier', profile.showNeighborhood],
                  ['showReviews', 'Afficher les avis reçus', profile.showReviews],
                  ['showCompletedServices', 'Afficher mes services terminés', profile.showCompletedServices],
                  ['showReputation', 'Afficher mon score de réputation', profile.showReputation],
                ].map(([name, label, checked]) => (
                  <label className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700" key={String(name)}>
                    <input defaultChecked={Boolean(checked)} name={String(name)} type="checkbox" />
                    {String(label)}
                  </label>
                ))}
                <Button className="w-fit" disabled={pending === 'save'} type="submit" variant="primary">
                  Enregistrer la confidentialité
                </Button>
              </Card>
            </form>
          ) : null}
        </>
      ) : null}
    </PageContainer>
  );
}
