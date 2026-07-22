import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'

import { ApiError } from '../../api/client'
import {
  archiveAdminVote,
  cancelAdminVote,
  closeAdminVote,
  createAdminVote,
  fetchAdminVote,
  fetchAdminVoteResults,
  fetchAdminVotes,
  openAdminVote,
  type AdminVote,
  type AdminVoteResults,
  type AdminVoteStatus,
  type CreateAdminVoteInput,
} from '../../api/localLife'
import { fetchNeighborhoods, type NeighborhoodItem } from '../../api/neighborhoods'
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
import { Input } from '../../components/ui/Input'
import { LoadingState } from '../../components/ui/LoadingState'
import { Modal } from '../../components/ui/Modal'
import { Textarea } from '../../components/ui/Textarea'

type VoteTab = 'all' | 'draft' | 'open' | 'closed'

const statusLabels: Record<AdminVoteStatus, string> = {
  draft: 'Brouillon',
  scheduled: 'Planifié',
  open: 'Ouvert',
  closed: 'Clos',
  cancelled: 'Annulé',
  archived: 'Archivé',
}
const ballotLabels: Record<AdminVote['ballotType'], string> = {
  yes_no: 'Oui / Non',
  single_choice: 'Choix unique',
  multiple_choice: 'Choix multiple',
  ranking: 'Classement',
}
const privacyLabels: Record<AdminVote['privacy'], string> = {
  anonymous: 'Anonyme',
  public: 'Public',
}

export function AdminVotesPage() {
  const [items, setItems] = useState<AdminVote[]>([])
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [votes, neighborhoodRows] = await Promise.all([
        fetchAdminVotes(),
        fetchNeighborhoods(),
      ])
      setItems(votes.items)
      setNeighborhoods(neighborhoodRows)
    } catch (caught) {
      setError(getErrorMessage(caught, 'Impossible de charger les votes.'))
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
      <VoteDetail
        onBack={() => setSelectedId(null)}
        onChanged={() => setRefreshKey((value) => value + 1)}
        voteId={selectedId}
      />
    )
  }

  if (loading) return <LoadingState message="Chargement des votes…" />

  return (
    <>
      <VoteList
        error={error}
        items={items}
        onCreate={() => setCreateOpen(true)}
        onSelect={setSelectedId}
      />
      <VoteCreateModal
        neighborhoods={neighborhoods}
        onClose={() => setCreateOpen(false)}
        onCreated={(vote) => {
          setCreateOpen(false)
          setItems((current) => [vote, ...current])
          setSelectedId(vote.id)
        }}
        open={createOpen}
      />
    </>
  )
}

function VoteList({
  error,
  items,
  onCreate,
  onSelect,
}: {
  error: string | null
  items: AdminVote[]
  onCreate: () => void
  onSelect: (id: string) => void
}) {
  const [tab, setTab] = useState<VoteTab>('all')
  const [ballot, setBallot] = useState('all')
  const [privacy, setPrivacy] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [sort, setSort] = useState<AdminSortState | null>({ key: 'created', direction: 'desc' })

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const status = item.status
        const tabMatches =
          tab === 'all'
          || (tab === 'draft' && ['draft', 'scheduled'].includes(status))
          || (tab === 'open' && status === 'open')
          || (tab === 'closed' && ['closed', 'cancelled', 'archived'].includes(status))
        return (
          tabMatches
          && (ballot === 'all' || item.ballotType === ballot)
          && (privacy === 'all' || item.privacy === privacy)
          && matchesSearch(
            query,
            item.title,
            item.description,
            item.neighborhood?.name,
            item.creator?.displayName,
          )
        )
      }),
    [ballot, items, privacy, query, tab],
  )
  const sorted = useMemo(
    () =>
      sortAdminRows(filtered, sort, {
        title: (item) => item.title,
        neighborhood: (item) => item.neighborhood?.name,
        ballot: (item) => ballotLabels[item.ballotType],
        status: (item) => statusLabels[item.status],
        answers: (item) => item.answersCount,
        closing: (item) => Date.parse(item.closesAt),
        created: (item) => Date.parse(item.opensAt),
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
    setBallot('all')
    setPrivacy('all')
    setQuery('')
    resetPage()
  }

  return (
    <section className="grid gap-4">
      <AdminListHeader
        action={<Button onClick={onCreate} variant="primary">Créer un vote</Button>}
        description="Préparez les consultations du quartier et suivez uniquement leurs résultats agrégés."
        title="Votes"
      />
      {error ? <ErrorMessage message={error} /> : null}
      <AdminListTabs
        items={[
          { id: 'all', label: 'Tous', count: items.length },
          {
            id: 'draft',
            label: 'À préparer',
            count: items.filter((item) => ['draft', 'scheduled'].includes(item.status)).length,
          },
          {
            id: 'open',
            label: 'Ouverts',
            count: items.filter((item) => item.status === 'open').length,
          },
          {
            id: 'closed',
            label: 'Terminés',
            count: items.filter((item) => ['closed', 'cancelled', 'archived'].includes(item.status)).length,
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
          placeholder="Rechercher une consultation ou un quartier"
          value={query}
        />
        <AdminSelect
          label="Type de bulletin"
          onChange={(value) => {
            setBallot(value)
            resetPage()
          }}
          value={ballot}
        >
          <option value="all">Tous les bulletins</option>
          {Object.entries(ballotLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </AdminSelect>
        <AdminSelect
          label="Confidentialité"
          onChange={(value) => {
            setPrivacy(value)
            resetPage()
          }}
          value={privacy}
        >
          <option value="all">Toutes les confidentialités</option>
          <option value="anonymous">Anonyme</option>
          <option value="public">Public</option>
        </AdminSelect>
        <AdminResetButton onClick={resetFilters} />
      </AdminListToolbar>
      <AdminListTable
        columns={[
          {
            header: 'Consultation',
            render: (item) => (
              <div className="min-w-0">
                <strong className="block truncate text-slate-950">{item.title}</strong>
                <span className="block truncate text-xs text-slate-500">
                  {privacyLabels[item.privacy]} · {item.creator?.displayName ?? 'Créateur inconnu'}
                </span>
              </div>
            ),
            sortKey: 'title',
            width: '27%',
          },
          {
            header: 'Quartier',
            render: (item) => item.neighborhood?.name ?? 'Quartier inconnu',
            sortKey: 'neighborhood',
            width: '14%',
          },
          {
            header: 'Bulletin',
            render: (item) => ballotLabels[item.ballotType],
            sortKey: 'ballot',
            width: '13%',
          },
          {
            className: 'whitespace-nowrap text-right',
            header: 'Réponses',
            render: (item) => item.answersCount,
            sortKey: 'answers',
            width: '9%',
          },
          {
            header: 'Statut',
            render: (item) => (
              <AdminBadge tone={statusTone(item.status)}>{statusLabels[item.status]}</AdminBadge>
            ),
            sortKey: 'status',
            width: '12%',
          },
          {
            className: 'whitespace-nowrap',
            header: 'Clôture',
            render: (item) => formatDate(item.closesAt),
            sortKey: 'closing',
            width: '16%',
          },
          {
            header: 'Actions',
            render: (item) => (
              <AdminActionMenu items={[{ label: 'Consulter', onClick: () => onSelect(item.id) }]} />
            ),
            width: '9%',
          },
        ]}
        emptyDescription="Les consultations correspondant aux filtres apparaîtront ici."
        emptyMessage="Aucun vote trouvé"
        getRowKey={(item) => item.id}
        minWidth="1020px"
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
        summaryLabel={`${sorted.length} votes`}
        tableLabel={tab === 'all' ? 'Tous' : tab === 'draft' ? 'À préparer' : statusLabels[tab]}
        total={sorted.length}
      />
    </section>
  )
}

function VoteDetail({
  onBack,
  onChanged,
  voteId,
}: {
  onBack: () => void
  onChanged: () => void
  voteId: string
}) {
  const [vote, setVote] = useState<AdminVote | null>(null)
  const [results, setResults] = useState<AdminVoteResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const load = useCallback(async () => {
    setError(null)
    try {
      const [nextVote, nextResults] = await Promise.all([
        fetchAdminVote(voteId),
        fetchAdminVoteResults(voteId),
      ])
      setVote(nextVote)
      setResults(nextResults)
    } catch (caught) {
      setError(getErrorMessage(caught, 'Impossible de charger ce vote.'))
    } finally {
      setLoading(false)
    }
  }, [voteId])

  useEffect(() => {
    void load()
  }, [load])

  async function run(action: () => Promise<AdminVote>, message: string) {
    setPending(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await action()
      setVote(updated)
      setResults(await fetchAdminVoteResults(updated.id))
      setSuccess(message)
      onChanged()
      return true
    } catch (caught) {
      setError(getErrorMessage(caught, 'Cette transition n’est plus disponible.'))
      return false
    } finally {
      setPending(false)
    }
  }

  if (loading) return <LoadingState message="Chargement du vote…" />
  if (!vote) {
    return (
      <section className="grid gap-4">
        {error ? <ErrorMessage message={error} /> : null}
        <Button className="w-fit" onClick={onBack}>Retour aux votes</Button>
      </section>
    )
  }

  return (
    <section className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <button className="mb-3 min-h-10 text-sm font-bold text-slate-500 hover:text-blue-700" onClick={onBack} type="button">
            ← Retour aux votes
          </button>
          <div className="flex flex-wrap gap-2">
            <AdminBadge tone={statusTone(vote.status)}>{statusLabels[vote.status]}</AdminBadge>
            <AdminBadge>{ballotLabels[vote.ballotType]}</AdminBadge>
            <AdminBadge tone={vote.privacy === 'anonymous' ? 'purple' : 'slate'}>
              {privacyLabels[vote.privacy]}
            </AdminBadge>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{vote.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {vote.neighborhood?.name ?? 'Quartier inconnu'} · clôture {formatDate(vote.closesAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {vote.permissions.canOpen ? (
            <Button disabled={pending} onClick={() => void run(() => openAdminVote(vote.id), 'Vote ouvert.')} variant="primary">
              Ouvrir
            </Button>
          ) : null}
          {vote.permissions.canClose ? (
            <Button disabled={pending} onClick={() => void run(() => closeAdminVote(vote.id), 'Vote clôturé.')} variant="secondary">
              Clôturer
            </Button>
          ) : null}
          {vote.permissions.canCancel ? (
            <Button disabled={pending} onClick={() => setCancelOpen(true)} variant="danger">
              Annuler
            </Button>
          ) : null}
          {vote.permissions.canArchive ? (
            <Button disabled={pending} onClick={() => void run(() => archiveAdminVote(vote.id), 'Vote archivé.')}>
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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <div className="grid content-start gap-5">
          <Card>
            <h2 className="text-lg font-bold text-slate-950">Configuration</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {vote.description || 'Aucune description complémentaire.'}
            </p>
            <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
              <Info label="Ouverture" value={formatDate(vote.opensAt)} />
              <Info label="Clôture" value={formatDate(vote.closesAt)} />
              <Info label="Créateur" value={vote.creator?.displayName ?? 'Inconnu'} />
              <Info label="Résultats" value={resultVisibilityLabel(vote.resultsVisibility)} />
            </dl>
          </Card>
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Résultats agrégés</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {vote.privacy === 'anonymous'
                    ? 'Aucune identité de votant n’est exposée.'
                    : 'Le tableau reste centré sur les totaux.'}
                </p>
              </div>
              <strong className="text-2xl text-slate-950">{results?.totalAnswers ?? vote.answersCount}</strong>
            </div>
            <div className="mt-5 grid gap-4">
              {(results?.results ?? []).map((row, index) => {
                const scale = vote.ballotType === 'ranking'
                  ? Math.max(...(results?.results ?? []).map((item) => item.bordaScore ?? 0), 1)
                  : 100
                const value = vote.ballotType === 'ranking' ? row.bordaScore ?? 0 : row.percentage
                return (
                  <div key={row.option.id}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-slate-800">
                        {vote.ballotType === 'ranking' ? `${index + 1}. ` : ''}{row.option.label}
                      </span>
                      <span className="text-slate-500">
                        {vote.ballotType === 'ranking'
                          ? `${row.bordaScore ?? 0} pts Borda`
                          : `${row.count} · ${row.percentage} %`}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${Math.max(0, Math.min(100, (value / scale) * 100))}%` }}
                      />
                    </div>
                  </div>
                )
              })}
              {(results?.results ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">Aucune réponse enregistrée.</p>
              ) : null}
            </div>
          </Card>
        </div>
        <Card className="h-fit">
          <h2 className="text-lg font-bold text-slate-950">Historique</h2>
          <ol className="mt-4 grid gap-4">
            {(vote.history ?? []).length === 0 ? (
              <li className="text-sm text-slate-500">Aucun événement d’audit.</li>
            ) : [...(vote.history ?? [])].reverse().map((entry, index) => (
              <li className="border-l-2 border-blue-200 pl-4" key={`${entry.occurredAt}-${index}`}>
                <strong className="block text-sm text-slate-900">{historyLabel(entry.type)}</strong>
                <span className="text-xs text-slate-500">{formatDate(entry.occurredAt)}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Modal
        description="Les réponses déjà enregistrées seront conservées à des fins d’audit."
        onClose={() => setCancelOpen(false)}
        open={cancelOpen}
        title="Annuler le vote"
      >
        <form
          className="grid gap-4"
          onSubmit={(formEvent) => {
            formEvent.preventDefault()
            void run(() => cancelAdminVote(vote.id, cancelReason), 'Vote annulé.').then((done) => {
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
              onChange={(event) => setCancelReason(event.target.value)}
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

function VoteCreateModal({
  neighborhoods,
  onClose,
  onCreated,
  open,
}: {
  neighborhoods: NeighborhoodItem[]
  onClose: () => void
  onCreated: (vote: AdminVote) => void
  open: boolean
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    neighborhoodId: '',
    ballotType: 'single_choice' as AdminVote['ballotType'],
    privacy: 'anonymous' as AdminVote['privacy'],
    resultsVisibility: 'after_close' as AdminVote['resultsVisibility'],
    options: 'Option 1\nOption 2',
    opensAt: '',
    closesAt: '',
    status: 'draft' as 'draft' | 'scheduled',
  })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const optionLabels = form.options.split('\n').map((value) => value.trim()).filter(Boolean)
    if (form.ballotType !== 'yes_no' && optionLabels.length < 2) {
      setError('Ajoutez au moins deux options, une par ligne.')
      return
    }
    setPending(true)
    try {
      const input: CreateAdminVoteInput = {
        title: form.title,
        description: form.description || undefined,
        neighborhoodId: form.neighborhoodId,
        ballotType: form.ballotType,
        privacy: form.privacy,
        resultsVisibility: form.resultsVisibility,
        options: (form.ballotType === 'yes_no' ? ['Oui', 'Non'] : optionLabels)
          .map((label) => ({ label })),
        allowAnswerChange: true,
        opensAt: form.opensAt ? new Date(form.opensAt).toISOString() : undefined,
        closesAt: new Date(form.closesAt).toISOString(),
        status: form.status,
      }
      onCreated(await createAdminVote(input))
      setForm((current) => ({ ...current, title: '', description: '' }))
    } catch (caught) {
      setError(getErrorMessage(caught, 'Impossible de créer ce vote.'))
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal
      description="Le vote est créé sans réponse au nom d’un habitant."
      onClose={onClose}
      open={open}
      title="Créer un vote"
    >
      <form className="grid gap-4" onSubmit={submit}>
        {error ? <ErrorMessage message={error} /> : null}
        <Field label="Titre">
          <Input
            maxLength={180}
            minLength={3}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            required
            value={form.title}
          />
        </Field>
        <Field label="Description">
          <Textarea
            maxLength={4000}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            rows={3}
            value={form.description}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Quartier">
            <select
              className={selectClass}
              onChange={(event) => setForm({ ...form, neighborhoodId: event.target.value })}
              required
              value={form.neighborhoodId}
            >
              <option value="">Choisir un quartier</option>
              {neighborhoods.map((item) => (
                <option key={item.id ?? item._id ?? item.slug} value={item.id ?? item._id ?? item.slug}>
                  {item.name} · {item.city}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Bulletin">
            <select
              className={selectClass}
              onChange={(event) => setForm({ ...form, ballotType: event.target.value as AdminVote['ballotType'] })}
              value={form.ballotType}
            >
              {Object.entries(ballotLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Confidentialité">
            <select
              className={selectClass}
              onChange={(event) => setForm({ ...form, privacy: event.target.value as AdminVote['privacy'] })}
              value={form.privacy}
            >
              <option value="anonymous">Anonyme</option>
              <option value="public">Public</option>
            </select>
          </Field>
          <Field label="Résultats">
            <select
              className={selectClass}
              onChange={(event) => setForm({ ...form, resultsVisibility: event.target.value as AdminVote['resultsVisibility'] })}
              value={form.resultsVisibility}
            >
              <option value="after_close">Après la clôture</option>
              <option value="after_submission">Après la réponse</option>
              <option value="always">Toujours visibles</option>
            </select>
          </Field>
        </div>
        <Field label={form.ballotType === 'yes_no' ? 'Options automatiques' : 'Options, une par ligne'}>
          {form.ballotType === 'yes_no' ? (
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">Oui · Non</div>
          ) : (
            <Textarea
              onChange={(event) => setForm({ ...form, options: event.target.value })}
              required
              rows={4}
              value={form.options}
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ouverture">
            <Input
              onChange={(event) => setForm({ ...form, opensAt: event.target.value })}
              type="datetime-local"
              value={form.opensAt}
            />
          </Field>
          <Field label="Clôture">
            <Input
              onChange={(event) => setForm({ ...form, closesAt: event.target.value })}
              required
              type="datetime-local"
              value={form.closesAt}
            />
          </Field>
        </div>
        <Field label="État initial">
          <select
            className={selectClass}
            onChange={(event) => setForm({ ...form, status: event.target.value as 'draft' | 'scheduled' })}
            value={form.status}
          >
            <option value="draft">Brouillon</option>
            <option value="scheduled">Planifié</option>
          </select>
        </Field>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Annuler</Button>
          <Button disabled={pending} type="submit" variant="primary">
            {pending ? 'Création…' : 'Créer le vote'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return <label className="grid gap-2 text-sm font-bold text-slate-800">{label}{children}</label>
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd>
    </div>
  )
}

const selectClass =
  'min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:outline focus:outline-4 focus:outline-blue-200'

function statusTone(status: AdminVoteStatus) {
  if (status === 'open') return 'blue' as const
  if (status === 'closed' || status === 'archived') return 'emerald' as const
  if (status === 'cancelled') return 'red' as const
  if (status === 'scheduled') return 'amber' as const
  return 'slate' as const
}

function resultVisibilityLabel(value: AdminVote['resultsVisibility']) {
  if (value === 'always') return 'Toujours visibles'
  if (value === 'after_submission') return 'Après participation'
  return 'Après clôture'
}

function historyLabel(type: string) {
  return ({
    created: 'Vote créé',
    scheduled: 'Vote planifié',
    opened: 'Vote ouvert',
    updated: 'Vote modifié',
    closed: 'Vote clôturé',
    cancelled: 'Vote annulé',
    archived: 'Vote archivé',
  } as Record<string, string>)[type] ?? type
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}
