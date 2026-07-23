import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  archiveAdminEvent,
  cancelAdminEvent,
  fetchAdminEvent,
  fetchAdminEventParticipants,
  fetchAdminEvents,
  type AdminEvent,
  type AdminEventParticipant,
  type AdminEventStatus,
} from '../../api/localLife'
import { ApiError } from '../../api/client'
import {
  AdminActionMenu,
  AdminBadge,
  AdminListHeader,
  AdminListTable,
  AdminListTabs,
  AdminListToolbar,
  AdminResetButton,
  AdminSearchInput,
  AdminSelect,
  formatDate,
  matchesSearch,
  paginateRows,
  sortAdminRows,
  type AdminSortState,
} from '../../components/ui/AdminList'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { LoadingState } from '../../components/ui/LoadingState'
import { Modal } from '../../components/ui/Modal'
import { Textarea } from '../../components/ui/Textarea'

type EventTab = 'all' | 'upcoming' | 'completed' | 'cancelled'

const statusLabels: Record<AdminEventStatus, string> = {
  draft: 'Brouillon',
  published: 'Publié',
  open_registration: 'Inscriptions ouvertes',
  full: 'Complet',
  started: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
  archived: 'Archivé',
}

const categoryLabels: Record<string, string> = {
  workshop: 'Atelier',
  party: 'Fête',
  fundraising: 'Collecte',
  sport: 'Sport',
  community_meeting: 'Réunion',
  children: 'Enfants',
  culture: 'Culture',
  help: 'Entraide',
  emergency: 'Urgence',
  other: 'Autre',
}

export function AdminEventsPage() {
  const [items, setItems] = useState<AdminEvent[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const load = useCallback(async () => {
    setError(null)
    try {
      setItems((await fetchAdminEvents()).items)
    } catch (caught) {
      setError(getErrorMessage(caught, 'Impossible de charger les événements.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshKey
    void load()
  }, [load, refreshKey])

  if (selectedId) {
    return (
      <EventDetail
        eventId={selectedId}
        onBack={() => setSelectedId(null)}
        onChanged={() => setRefreshKey((value) => value + 1)}
      />
    )
  }

  if (loading) return <LoadingState message="Chargement des événements…" />

  return (
    <EventList
      error={error}
      items={items}
      onRefresh={() => setRefreshKey((value) => value + 1)}
      onSelect={setSelectedId}
    />
  )
}

function EventList({
  error,
  items,
  onRefresh,
  onSelect,
}: {
  error: string | null
  items: AdminEvent[]
  onRefresh: () => void
  onSelect: (id: string) => void
}) {
  const [tab, setTab] = useState<EventTab>('all')
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [sort, setSort] = useState<AdminSortState | null>({ key: 'date', direction: 'asc' })

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const status = item.effectiveStatus ?? item.status
        const matchesTab =
          tab === 'all'
          || (tab === 'upcoming' && !['completed', 'cancelled', 'archived'].includes(status))
          || (tab === 'completed' && status === 'completed')
          || (tab === 'cancelled' && ['cancelled', 'archived'].includes(status))
        return (
          matchesTab
          && (category === 'all' || item.category === category)
          && matchesSearch(
            query,
            item.title,
            item.locationLabel,
            item.organizer?.displayName,
            item.neighborhood?.name,
          )
        )
      }),
    [category, items, query, tab],
  )

  const sorted = useMemo(
    () =>
      sortAdminRows(filtered, sort, {
        title: (item) => item.title,
        organizer: (item) => item.organizer?.displayName,
        neighborhood: (item) => item.neighborhood?.name,
        date: (item) => Date.parse(item.startsAt),
        participants: (item) => item.counts.participants,
        status: (item) => statusLabels[item.effectiveStatus ?? item.status],
      }),
    [filtered, sort],
  )
  const rows = paginateRows(sorted, page, pageSize)

  function resetPage() {
    setPage(1)
    setSelectedRows([])
  }

  function resetFilters() {
    setTab('all')
    setCategory('all')
    setQuery('')
    resetPage()
  }

  return (
    <section className="grid gap-4">
      <AdminListHeader
        action={<Button onClick={onRefresh}>Actualiser</Button>}
        description="Supervisez les rendez-vous du quartier sans participer à la place des habitants."
        title="Événements"
      />
      {error ? <ErrorMessage message={error} /> : null}
      <AdminListTabs
        items={[
          { id: 'all', label: 'Tous', count: items.length },
          {
            id: 'upcoming',
            label: 'À venir',
            count: items.filter((item) =>
              !['completed', 'cancelled', 'archived'].includes(item.effectiveStatus ?? item.status),
            ).length,
          },
          {
            id: 'completed',
            label: 'Terminés',
            count: items.filter((item) => (item.effectiveStatus ?? item.status) === 'completed').length,
          },
          {
            id: 'cancelled',
            label: 'Annulés',
            count: items.filter((item) =>
              ['cancelled', 'archived'].includes(item.effectiveStatus ?? item.status),
            ).length,
          },
        ]}
        onChange={(value) => {
          setTab(value)
          resetPage()
        }}
        value={tab}
      />
      <AdminListToolbar>
        <AdminSearchInput
          onChange={(value) => {
            setQuery(value)
            resetPage()
          }}
          placeholder="Rechercher un événement, un lieu ou un organisateur"
          value={query}
        />
        <AdminSelect
          label="Catégorie"
          onChange={(value) => {
            setCategory(value)
            resetPage()
          }}
          value={category}
        >
          <option value="all">Toutes les catégories</option>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </AdminSelect>
        <AdminResetButton onClick={resetFilters} />
      </AdminListToolbar>
      <AdminListTable
        columns={[
          {
            header: 'Événement',
            render: (item) => (
              <div className="min-w-0">
                <strong className="block truncate text-slate-950">{item.title}</strong>
                <span className="block truncate text-xs text-slate-500">
                  {categoryLabels[item.category] ?? item.category} · {item.locationLabel}
                </span>
              </div>
            ),
            sortKey: 'title',
            width: '25%',
          },
          {
            header: 'Quartier',
            render: (item) => item.neighborhood?.name ?? 'Quartier inconnu',
            sortKey: 'neighborhood',
            width: '13%',
          },
          {
            header: 'Organisateur',
            render: (item) => item.organizer?.displayName ?? 'Organisateur inconnu',
            sortKey: 'organizer',
            width: '14%',
          },
          {
            className: 'whitespace-nowrap',
            header: 'Date',
            render: (item) => formatDate(item.startsAt),
            sortKey: 'date',
            width: '14%',
          },
          {
            className: 'whitespace-nowrap text-right',
            header: 'Participants',
            render: (item) => (
              <span>
                {item.counts.participants}
                {item.capacity ? ` / ${item.capacity}` : ''}
                {item.counts.waitlisted > 0 ? (
                  <small className="ml-1 text-amber-700">+{item.counts.waitlisted}</small>
                ) : null}
              </span>
            ),
            sortKey: 'participants',
            width: '11%',
          },
          {
            header: 'Statut',
            render: (item) => (
              <AdminBadge tone={statusTone(item.effectiveStatus ?? item.status)}>
                {statusLabels[item.effectiveStatus ?? item.status]}
              </AdminBadge>
            ),
            sortKey: 'status',
            width: '14%',
          },
          {
            header: 'Actions',
            render: (item) => (
              <AdminActionMenu
                items={[{ label: 'Consulter', onClick: () => onSelect(item.id) }]}
              />
            ),
            width: '9%',
          },
        ]}
        emptyDescription="Les événements correspondant aux filtres apparaîtront ici."
        emptyMessage="Aucun événement trouvé"
        getRowKey={(item) => item.id}
        minWidth="1050px"
        onPageChange={(value) => {
          setPage(value)
          setSelectedRows([])
        }}
        onPageSizeChange={(value) => {
          setPageSize(value)
          resetPage()
        }}
        onRowClick={(item) => onSelect(item.id)}
        onSelectedRowKeysChange={setSelectedRows}
        onSortChange={(value) => {
          setSort(value)
          resetPage()
        }}
        page={page}
        pageSize={pageSize}
        rows={rows}
        selectedRowKeys={selectedRows}
        sort={sort}
        summaryLabel={`${sorted.length} événements`}
        tableLabel={tab === 'all' ? 'Tous' : tab === 'upcoming' ? 'À venir' : statusLabels[tab]}
        total={sorted.length}
      />
    </section>
  )
}

function EventDetail({
  eventId,
  onBack,
  onChanged,
}: {
  eventId: string
  onBack: () => void
  onChanged: () => void
}) {
  const [event, setEvent] = useState<AdminEvent | null>(null)
  const [participants, setParticipants] = useState<AdminEventParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const load = useCallback(async () => {
    setError(null)
    try {
      const [nextEvent, nextParticipants] = await Promise.all([
        fetchAdminEvent(eventId),
        fetchAdminEventParticipants(eventId),
      ])
      setEvent(nextEvent)
      setParticipants(nextParticipants)
    } catch (caught) {
      setError(getErrorMessage(caught, 'Impossible de charger cet événement.'))
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    void load()
  }, [load])

  async function run(action: () => Promise<AdminEvent>, message: string) {
    setPending(true)
    setError(null)
    setSuccess(null)
    try {
      setEvent(await action())
      setSuccess(message)
      onChanged()
      return true
    } catch (caught) {
      setError(getErrorMessage(caught, 'Action impossible sur cet événement.'))
      return false
    } finally {
      setPending(false)
    }
  }

  if (loading) return <LoadingState message="Chargement de l’événement…" />
  if (!event) {
    return (
      <section className="grid gap-4">
        {error ? <ErrorMessage message={error} /> : null}
        <Button className="w-fit" onClick={onBack}>Retour aux événements</Button>
      </section>
    )
  }

  return (
    <section className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <button className="mb-3 min-h-10 text-sm font-bold text-slate-500 hover:text-blue-700" onClick={onBack} type="button">
            ← Retour aux événements
          </button>
          <div className="flex flex-wrap gap-2">
            <AdminBadge tone={statusTone(event.effectiveStatus ?? event.status)}>
              {statusLabels[event.effectiveStatus ?? event.status]}
            </AdminBadge>
            <AdminBadge>{categoryLabels[event.category] ?? event.category}</AdminBadge>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{event.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {event.neighborhood?.name ?? 'Quartier inconnu'} · {formatDate(event.startsAt)}
          </p>
        </div>
        <div className="flex gap-2">
          {event.permissions.canCancel ? (
            <Button disabled={pending} onClick={() => setCancelOpen(true)} variant="danger">
              Annuler
            </Button>
          ) : null}
          {event.permissions.canArchive ? (
            <Button
              disabled={pending}
              onClick={() => void run(() => archiveAdminEvent(event.id), 'Événement archivé.')}
              variant="secondary"
            >
              Archiver
            </Button>
          ) : null}
        </div>
      </header>

      {error ? <ErrorMessage message={error} /> : null}
      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          {success}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(19rem,0.7fr)]">
        <div className="grid content-start gap-5">
          <Card>
            <h2 className="text-lg font-bold text-slate-950">Présentation</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{event.description}</p>
            <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
              <Info label="Lieu" value={event.locationLabel} />
              <Info label="Fin" value={formatDate(event.endsAt)} />
              <Info label="Organisateur" value={event.organizer?.displayName ?? 'Inconnu'} />
              <Info label="Capacité" value={event.capacity ? `${event.counts.participants} / ${event.capacity}` : 'Sans limite'} />
            </dl>
          </Card>
          <Card>
            <h2 className="text-lg font-bold text-slate-950">Participants et liste d’attente</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {participants.length === 0 ? (
                <p className="py-4 text-sm text-slate-500">Aucun participant inscrit.</p>
              ) : participants.map((participant) => (
                <div className="flex items-center justify-between gap-3 py-3" key={participant.id}>
                  <div>
                    <strong className="text-sm text-slate-950">
                      {participant.user?.displayName ?? 'Habitant inconnu'}
                    </strong>
                    <p className="text-xs text-slate-500">{formatDate(participant.respondedAt)}</p>
                  </div>
                  <AdminBadge tone={participant.response === 'going' ? 'emerald' : 'amber'}>
                    {participant.response === 'going'
                      ? 'Participant'
                      : `Attente${participant.waitlistPosition ? ` n°${participant.waitlistPosition}` : ''}`}
                  </AdminBadge>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <Card className="h-fit">
          <h2 className="text-lg font-bold text-slate-950">Historique</h2>
          <ol className="mt-4 grid gap-4">
            {(event.history ?? []).length === 0 ? (
              <li className="text-sm text-slate-500">Aucun événement d’audit.</li>
            ) : [...(event.history ?? [])].reverse().map((entry, index) => (
              <li className="border-l-2 border-blue-200 pl-4" key={`${entry.occurredAt}-${index}`}>
                <strong className="block text-sm text-slate-900">{historyLabel(entry.type)}</strong>
                <span className="text-xs text-slate-500">{formatDate(entry.occurredAt)}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Modal
        description="Cette action ferme les inscriptions et conserve l’historique."
        onClose={() => setCancelOpen(false)}
        open={cancelOpen}
        title="Annuler l’événement"
      >
        <form
          className="grid gap-4"
          onSubmit={(formEvent) => {
            formEvent.preventDefault()
            void run(
              () => cancelAdminEvent(event.id, cancelReason),
              'Événement annulé.',
            ).then((done) => {
              if (done) {
                setCancelOpen(false)
                setCancelReason('')
              }
            })
          }}
        >
          <label className="grid gap-2 text-sm font-bold text-slate-800">
            Motif
            <Textarea
              maxLength={1000}
              minLength={5}
              onChange={(inputEvent) => setCancelReason(inputEvent.target.value)}
              required
              rows={4}
              value={cancelReason}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setCancelOpen(false)}>Conserver</Button>
            <Button disabled={pending} type="submit" variant="danger">Confirmer l’annulation</Button>
          </div>
        </form>
      </Modal>
    </section>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd>
    </div>
  )
}

function statusTone(status: AdminEventStatus) {
  if (status === 'completed' || status === 'archived') return 'emerald' as const
  if (status === 'cancelled') return 'red' as const
  if (status === 'full' || status === 'started') return 'amber' as const
  if (status === 'draft') return 'slate' as const
  return 'blue' as const
}

function historyLabel(type: string) {
  return ({
    created: 'Événement créé',
    published: 'Événement publié',
    updated: 'Informations modifiées',
    cancelled: 'Événement annulé',
    started: 'Événement démarré',
    completed: 'Événement terminé',
    archived: 'Événement archivé',
  } as Record<string, string>)[type] ?? type
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}
