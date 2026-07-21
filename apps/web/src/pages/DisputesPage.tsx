import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getMyDisputes, type DisputeSummary } from '../api/disputes'
import { useAuth } from '../auth/useAuth'
import { PageContainer } from '../components/layout/PageContainer'
import { Badge } from '../components/ui/Badge'
import { buttonStyles } from '../components/ui/buttonStyles'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { Icon } from '../components/ui/Icon'
import { LoadingState } from '../components/ui/LoadingState'
import {
  disputeReasonLabels,
  disputeStatusLabels,
  getDisputeTone,
} from '../features/disputes/disputePresentation'
import { getFriendlyError } from '../utils/errors'
import { formatDate } from '../utils/format'

export function DisputesPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<DisputeSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getMyDisputes()
      .then((result) => {
        if (active) setItems(result)
      })
      .catch((caught) => {
        if (active) {
          setError(getFriendlyError(caught, 'Impossible de charger vos litiges.'))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <PageContainer className="grid gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-emerald-700">Mes activités</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950 sm:text-3xl">Mes litiges</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Suivez les contestations liées à vos services et ajoutez les éléments utiles à leur
            examen.
          </p>
        </div>
        <Link className={buttonStyles('ghost', 'md')} to="/activities">
          Retour aux activités
        </Link>
      </header>

      {error ? <ErrorMessage message={error} /> : null}
      {loading ? <LoadingState message="Chargement de vos litiges…" /> : null}
      {!loading && items.length === 0 ? (
        <EmptyState
          icon="contract"
          message="Un litige ouvert depuis le suivi d’un service apparaîtra ici."
          title="Aucun litige"
        />
      ) : null}

      <div className="grid gap-4">
        {items.map((dispute) => {
          const otherParty =
            dispute.requester?.id === user?.id ? dispute.provider : dispute.requester
          return (
            <Card
              as="article"
              className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
              key={dispute.id}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={getDisputeTone(dispute.status)}>
                    {disputeStatusLabels[dispute.status]}
                  </Badge>
                  <span className="text-xs font-semibold text-slate-500">
                    {dispute.reservedPoints} points gelés
                  </span>
                </div>
                <h2 className="mt-3 truncate text-lg font-extrabold text-slate-950">
                  {dispute.service?.title ?? 'Service indisponible'}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {disputeReasonLabels[dispute.reason]}
                  {otherParty ? ' · avec ' + otherParty.displayName : ''}
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Icon className="size-4" name="clock" />
                  Ouvert le {formatDate(dispute.openedAt)}
                </p>
              </div>
              <Link
                className={buttonStyles('secondary', 'sm', 'w-full md:w-auto')}
                to={'/disputes/' + dispute.id}
              >
                Consulter le dossier
              </Link>
            </Card>
          )
        })}
      </div>
    </PageContainer>
  )
}
