import { Link } from 'react-router-dom';

import type { VoteItem } from '../../../api/votes';
import { Badge } from '../../../components/ui/Badge';
import { buttonStyles } from '../../../components/ui/buttonStyles';
import { Card } from '../../../components/ui/Card';
import { Icon } from '../../../components/ui/Icon';
import { formatDate } from '../../../utils/format';
import { votePrivacyLabels, voteStatusLabels, voteTypeLabels } from '../localLifePresentation';

export function VoteCard({ vote }: { vote: VoteItem }) {
  return (
    <Card as="article" className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={vote.status === 'open' ? 'success' : vote.status === 'closed' ? 'neutral' : 'info'}>{voteStatusLabels[vote.status]}</Badge>
        <Badge>{voteTypeLabels[vote.ballotType]}</Badge>
      </div>
      <div className="flex-1">
        <h2 className="text-lg font-extrabold text-slate-950">{vote.title}</h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{vote.description}</p>
      </div>
      <div className="grid gap-2 text-sm text-slate-600">
        <p className="flex items-center gap-2"><Icon className="size-4 text-emerald-700" name="clock" />Clôture le {formatDate(vote.closesAt, { dateStyle: 'medium', timeStyle: 'short' })}</p>
        <p>{votePrivacyLabels[vote.privacy]} · {vote.answersCount} réponse{vote.answersCount > 1 ? 's' : ''}</p>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <span className="text-xs font-semibold text-slate-500">{vote.viewerAnswer ? 'Réponse enregistrée' : vote.resultsAvailable ? 'Résultats disponibles' : 'À découvrir'}</span>
        <Link className={buttonStyles(vote.permissions.canAnswer ? 'primary' : 'secondary', 'sm')} to={`/votes/${vote.id}`}>{vote.permissions.canAnswer ? 'Répondre' : 'Consulter'}</Link>
      </div>
    </Card>
  );
}
