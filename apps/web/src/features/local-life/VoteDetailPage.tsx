import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';

import { answerVote, getVote, type VoteItem } from '../../api/votes';
import { PageContainer } from '../../components/layout/PageContainer';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Icon } from '../../components/ui/Icon';
import { LoadingState } from '../../components/ui/LoadingState';
import { getFriendlyError } from '../../utils/errors';
import { formatDate } from '../../utils/format';
import { votePrivacyLabels, voteStatusLabels, voteTypeLabels } from './localLifePresentation';

export function VoteDetailPage() {
  const { voteId = '' } = useParams();
  const [vote, setVote] = useState<VoteItem | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [ranking, setRanking] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    const loaded = await getVote(voteId);
    setVote(loaded);
    setSelected(loaded.viewerAnswer?.selectedOptionIds ?? []);
    const ordered = loaded.viewerAnswer?.ranking.length
      ? [...loaded.viewerAnswer.ranking].sort((left, right) => left.rank - right.rank).map((entry) => entry.optionId)
      : loaded.options.map((option) => option.id);
    setRanking(ordered);
  }, [voteId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    load().catch((caught) => { if (active) setError(getFriendlyError(caught, 'Impossible de charger ce vote.')); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load]);

  function toggle(optionId: string) {
    if (!vote) return;
    if (['yes_no', 'single_choice'].includes(vote.ballotType)) { setSelected([optionId]); return; }
    setSelected((current) => current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]);
  }

  function move(optionId: string, direction: -1 | 1) {
    setRanking((current) => {
      const index = current.indexOf(optionId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!vote) return;
    const ids = vote.ballotType === 'ranking' ? ranking : selected;
    if (!window.confirm(vote.viewerAnswer ? 'Mettre à jour votre réponse ?' : 'Confirmer votre réponse ?')) return;
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await answerVote(vote.id, ids, vote.ballotType === 'ranking' ? ranking.map((optionId, index) => ({ optionId, rank: index + 1 })) : undefined);
      setSuccess(result.unchanged ? 'Votre réponse était déjà enregistrée.' : 'Votre réponse a bien été enregistrée.');
      await load();
    } catch (caught) { setError(getFriendlyError(caught, 'Votre réponse n’a pas pu être enregistrée.')); }
    finally { setPending(false); }
  }

  if (loading) return <PageContainer><LoadingState message="Chargement du vote…" /></PageContainer>;
  if (!vote) return <PageContainer className="grid gap-4">{error ? <ErrorMessage message={error} /> : null}<EmptyState icon="check" message="Ce vote est introuvable ou n’est plus visible." title="Vote indisponible" /></PageContainer>;

  const canSubmit = vote.permissions.canAnswer || vote.permissions.canChangeAnswer;
  return (
    <PageContainer className="grid gap-6 pb-28 lg:pb-8">
      <Link className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg text-sm font-bold text-slate-600 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" to="/votes"><Icon className="size-4" name="arrow-left" /> Retour aux votes</Link>
      {error ? <ErrorMessage message={error} /> : null}
      {success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800" role="status">{success}</div> : null}
      <header><div className="flex flex-wrap gap-2"><Badge tone={vote.status === 'open' ? 'success' : 'neutral'}>{voteStatusLabels[vote.status]}</Badge><Badge>{voteTypeLabels[vote.ballotType]}</Badge><Badge tone="info">{votePrivacyLabels[vote.privacy]}</Badge></div><h1 className="mt-4 text-2xl font-extrabold text-slate-950 sm:text-3xl">{vote.title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{vote.description}</p></header>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="grid gap-5">
          <Card><form className="grid gap-5" onSubmit={submit}><div><h2 className="text-lg font-extrabold text-slate-950">Votre réponse</h2><p className="mt-1 text-sm text-slate-600">{vote.ballotType === 'ranking' ? 'Classez toutes les options. La première reçoit le plus de points.' : vote.ballotType === 'multiple_choice' ? `Sélectionnez entre ${vote.minSelections ?? 1} et ${vote.maxSelections ?? vote.options.length} options.` : 'Choisissez une option.'}</p></div>{vote.ballotType === 'ranking' ? <ol className="grid gap-2">{ranking.map((optionId, index) => { const option = vote.options.find((item) => item.id === optionId); if (!option) return null; return <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-slate-200 p-3" key={optionId}><span className="grid size-8 place-items-center rounded-full bg-emerald-100 text-sm font-extrabold text-emerald-800">{index + 1}</span><div><p className="font-bold text-slate-900">{option.label}</p>{option.description ? <p className="text-sm text-slate-600">{option.description}</p> : null}</div><div className="flex"><Button aria-label={`Monter ${option.label}`} disabled={!canSubmit || index === 0} onClick={() => move(optionId, -1)} size="sm" variant="ghost">↑</Button><Button aria-label={`Descendre ${option.label}`} disabled={!canSubmit || index === ranking.length - 1} onClick={() => move(optionId, 1)} size="sm" variant="ghost">↓</Button></div></li>; })}</ol> : <fieldset className="grid gap-2"><legend className="sr-only">Options</legend>{vote.options.map((option) => { const checked = selected.includes(option.id); const multiple = vote.ballotType === 'multiple_choice'; return <label className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${checked ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`} key={option.id}><input checked={checked} className="mt-1 size-4 accent-emerald-700" disabled={!canSubmit} name="vote-option" onChange={() => toggle(option.id)} type={multiple ? 'checkbox' : 'radio'} /><span><strong className="block text-sm text-slate-950">{option.label}</strong>{option.description ? <span className="mt-1 block text-sm text-slate-600">{option.description}</span> : null}</span></label>; })}</fieldset>}{canSubmit ? <Button disabled={pending || (vote.ballotType !== 'ranking' && selected.length === 0)} type="submit" variant="primary">{pending ? 'Enregistrement…' : vote.viewerAnswer ? 'Mettre à jour ma réponse' : 'Confirmer ma réponse'}</Button> : <p className="rounded-lg bg-slate-100 p-4 text-sm font-semibold text-slate-700">{vote.viewerAnswer ? 'Votre réponse est enregistrée.' : 'Ce vote n’accepte plus de réponse.'}</p>}</form></Card>
          <Card><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold text-slate-950">Résultats</h2><p className="mt-1 text-sm text-slate-600">Pourcentages calculés sur {vote.results?.totalAnswers ?? vote.answersCount} répondant(s).</p></div><Badge>{vote.answersCount} réponse(s)</Badge></div>{vote.results ? <div className="mt-5 grid gap-4">{vote.results.results.map((result, index) => <div key={result.option.id}><div className="flex items-center justify-between gap-3 text-sm"><span className="font-bold text-slate-900">{vote.ballotType === 'ranking' ? `${index + 1}. ` : ''}{result.option.label}</span><span className="font-semibold text-slate-600">{vote.ballotType === 'ranking' ? `${result.bordaScore} pts` : `${result.count} · ${result.percentage}%`}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(100, vote.ballotType === 'ranking' ? vote.results!.results.length ? ((result.bordaScore ?? 0) / Math.max(...vote.results!.results.map((item) => item.bordaScore ?? 0), 1)) * 100 : 0 : result.percentage)}%` }} /></div></div>)}</div> : <p className="mt-4 rounded-lg bg-slate-100 p-4 text-sm text-slate-600">{vote.resultsLockedReason === 'available_after_submission' ? 'Répondez pour consulter les résultats.' : 'Les résultats seront publiés après la clôture.'}</p>}</Card>
        </main>
        <aside className="grid content-start gap-4"><Card className="grid gap-3"><h2 className="font-extrabold text-slate-950">Informations</h2><dl className="grid gap-3 text-sm"><div><dt className="font-bold text-slate-500">Quartier</dt><dd className="mt-1 text-slate-900">{vote.neighborhood?.name ?? 'Votre quartier'}</dd></div><div><dt className="font-bold text-slate-500">Ouverture</dt><dd className="mt-1 text-slate-900">{formatDate(vote.opensAt, { dateStyle: 'medium', timeStyle: 'short' })}</dd></div><div><dt className="font-bold text-slate-500">Clôture</dt><dd className="mt-1 text-slate-900">{formatDate(vote.closesAt, { dateStyle: 'medium', timeStyle: 'short' })}</dd></div></dl></Card><Card className="grid gap-2"><h2 className="font-extrabold text-slate-950">Confidentialité</h2><p className="text-sm leading-6 text-slate-600">{vote.privacy === 'anonymous' ? 'Votre identité n’apparaît pas dans les résultats. Une association privée est conservée uniquement pour empêcher le double vote.' : 'Ce bulletin est public, mais cette page présente uniquement des résultats agrégés.'}</p></Card></aside>
      </div>
    </PageContainer>
  );
}
