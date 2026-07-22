import { useEffect, useState } from 'react';

import { getVotes, type VoteItem, type VoteStatus } from '../../api/votes';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Icon } from '../../components/ui/Icon';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { getFriendlyError } from '../../utils/errors';
import { VoteCard } from './components/VoteCard';

type VoteTab = 'all' | 'open' | 'scheduled' | 'closed' | 'answered';

export function VotesPage() {
  const [items, setItems] = useState<VoteItem[]>([]);
  const [tab, setTab] = useState<VoteTab>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      const query: Record<string, string | boolean | number | undefined> = { search, limit: 40 };
      if (['open', 'scheduled', 'closed'].includes(tab)) query.status = tab as VoteStatus;
      if (tab === 'answered') query.answered = true;
      getVotes(query).then((result) => { if (active) setItems(result.items); }).catch((caught) => {
        if (active) setError(getFriendlyError(caught, 'Impossible de charger les votes.'));
      }).finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [search, tab]);

  return (
    <PageContainer className="grid gap-6">
      <PageHeader description="Consultez les décisions ouvertes aux habitants et retrouvez vos réponses." eyebrow="Vie locale" title="Votes du quartier" />
      <Tabs items={[{ id: 'all', label: 'Tous' }, { id: 'open', label: 'Ouverts' }, { id: 'scheduled', label: 'Planifiés' }, { id: 'closed', label: 'Terminés' }, { id: 'answered', label: 'Déjà répondus' }]} label="Filtrer les votes" onChange={setTab} value={tab} />
      <label className="relative max-w-2xl"><span className="sr-only">Rechercher un vote</span><Icon className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-400" name="search" /><Input className="pl-10" onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une consultation…" value={search} /></label>
      {error ? <ErrorMessage message={error} /> : null}
      {loading ? <LoadingState message="Chargement des votes…" /> : null}
      {!loading && items.length === 0 ? <EmptyState icon="check" message="Aucune consultation ne correspond à ce filtre." title="Aucun vote trouvé" /> : null}
      {!loading && items.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((vote) => <VoteCard key={vote.id} vote={vote} />)}</div> : null}
      {!loading && items.length > 0 ? <div className="flex justify-center"><Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} size="sm" variant="ghost">Revenir en haut</Button></div> : null}
    </PageContainer>
  );
}
