import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  fetchAdminReview,
  fetchAdminReviews,
  hideAdminReview,
  restoreAdminReview,
  type AdminReview,
  type AdminReviewStatus,
} from '../../api/reviews'
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

type ReviewTab = 'all' | AdminReviewStatus

const statusLabels: Record<AdminReviewStatus, string> = {
  published: 'Publié',
  hidden: 'Masqué',
}

export function AdminReviewsPage() {
  const [items, setItems] = useState<AdminReview[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<AdminReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const response = await fetchAdminReviews()
      setItems(response.items)
    } catch (caught) {
      setError(getErrorMessage(caught))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!selectedId) {
      setSelected(null)
      return
    }
    setError(null)
    void fetchAdminReview(selectedId)
      .then(setSelected)
      .catch((caught) => setError(getErrorMessage(caught)))
  }, [selectedId])

  function replaceItem(updated: AdminReview) {
    setSelected(updated)
    setItems((current) => current.map((item) => item.id === updated.id ? updated : item))
  }

  if (loading) return <LoadingState message="Chargement des avis…" />
  if (selectedId) {
    return (
      <ReviewDetail
        error={error}
        onBack={() => setSelectedId(null)}
        onChanged={replaceItem}
        review={selected}
      />
    )
  }

  return (
    <ReviewsList
      error={error}
      items={items}
      onRefresh={() => void load()}
      onSelect={setSelectedId}
    />
  )
}

function ReviewsList({
  error,
  items,
  onRefresh,
  onSelect,
}: {
  error: string | null
  items: AdminReview[]
  onRefresh: () => void
  onSelect: (id: string) => void
}) {
  const [activeTab, setActiveTab] = useState<ReviewTab>('all')
  const [rating, setRating] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [sort, setSort] = useState<AdminSortState | null>({ direction: 'desc', key: 'date' })

  const filtered = useMemo(() => items.filter((item) =>
    (activeTab === 'all' || item.status === activeTab) &&
    (rating === 'all' || item.rating === Number(rating)) &&
    matchesSearch(
      query,
      item.author?.displayName,
      item.targetUser?.displayName,
      item.service?.title,
      item.comment,
    )), [activeTab, items, query, rating])

  const sorted = useMemo(() => sortAdminRows(filtered, sort, {
    author: (item) => item.author?.displayName,
    date: (item) => Date.parse(item.createdAt ?? ''),
    rating: (item) => item.rating,
    service: (item) => item.service?.title,
    status: (item) => statusLabels[item.status],
    target: (item) => item.targetUser?.displayName,
  }), [filtered, sort])
  const rows = paginateRows(sorted, page, pageSize)

  function resetPage() {
    setPage(1)
    setSelectedRowKeys([])
  }

  return (
    <section className="grid gap-4">
      <AdminListHeader
        action={<Button onClick={onRefresh}>Actualiser</Button>}
        description="Contrôlez les avis publiés et leur historique sans modifier leur contenu."
        title="Avis"
      />
      {error ? <ErrorMessage message={error} /> : null}
      <AdminListTabs
        items={[
          { id: 'all', label: 'Tous', count: items.length },
          { id: 'published', label: 'Publiés', count: items.filter((item) => item.status === 'published').length },
          { id: 'hidden', label: 'Masqués', count: items.filter((item) => item.status === 'hidden').length },
        ]}
        onChange={(value) => { setActiveTab(value); resetPage() }}
        value={activeTab}
      />
      <AdminListToolbar>
        <AdminSearchInput
          onChange={(value) => { setQuery(value); resetPage() }}
          placeholder="Rechercher un auteur, un service ou un commentaire"
          value={query}
        />
        <AdminSelect label="Note" onChange={(value) => { setRating(value); resetPage() }} value={rating}>
          <option value="all">Toutes les notes</option>
          {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}/5</option>)}
        </AdminSelect>
        <AdminResetButton onClick={() => {
          setActiveTab('all')
          setRating('all')
          setQuery('')
          resetPage()
        }} />
      </AdminListToolbar>
      <AdminListTable
        columns={[
          { header: 'Note', render: (item) => <strong className="text-amber-700">{item.rating}/5</strong>, sortKey: 'rating', width: '8%' },
          { header: 'Auteur', render: (item) => item.author?.displayName ?? 'Compte indisponible', sortKey: 'author', width: '15%' },
          { header: 'Évalué', render: (item) => item.targetUser?.displayName ?? 'Compte indisponible', sortKey: 'target', width: '15%' },
          { header: 'Service', render: (item) => <span className="block truncate">{item.service?.title ?? 'Service indisponible'}</span>, sortKey: 'service', width: '19%' },
          { header: 'Commentaire', render: (item) => <span className="block truncate text-slate-600" title={item.comment}>{item.comment || 'Sans commentaire'}</span>, width: '22%' },
          { header: 'Statut', render: (item) => <AdminBadge tone={item.status === 'published' ? 'emerald' : 'amber'}>{statusLabels[item.status]}</AdminBadge>, sortKey: 'status', width: '9%' },
          { className: 'whitespace-nowrap', header: 'Date', render: (item) => formatDate(item.createdAt), sortKey: 'date', width: '10%' },
          { header: 'Actions', render: (item) => <AdminActionMenu items={[{ label: 'Consulter', onClick: () => onSelect(item.id) }]} />, width: '7%' },
        ]}
        emptyDescription="Les avis publiés après un service terminé apparaîtront ici."
        emptyMessage="Aucun avis trouvé"
        getRowKey={(item) => item.id}
        minWidth="1080px"
        onPageChange={(value) => { setPage(value); setSelectedRowKeys([]) }}
        onPageSizeChange={(value) => { setPageSize(value); resetPage() }}
        onRowClick={(item) => onSelect(item.id)}
        onSelectedRowKeysChange={setSelectedRowKeys}
        onSortChange={(value) => { setSort(value); resetPage() }}
        page={page}
        pageSize={pageSize}
        rows={rows}
        selectedRowKeys={selectedRowKeys}
        sort={sort}
        summaryLabel={`${sorted.length} avis`}
        tableLabel={activeTab === 'all' ? 'Tous' : statusLabels[activeTab]}
        total={sorted.length}
      />
    </section>
  )
}

function ReviewDetail({
  error,
  onBack,
  onChanged,
  review,
}: {
  error: string | null
  onBack: () => void
  onChanged: (review: AdminReview) => void
  review: AdminReview | null
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [pending, setPending] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function moderate() {
    if (!review || !reason.trim()) return
    setPending(true)
    setActionError(null)
    try {
      const updated = review.status === 'published'
        ? await hideAdminReview(review.id, reason.trim())
        : await restoreAdminReview(review.id, reason.trim())
      onChanged(updated)
      setReason('')
      setModalOpen(false)
    } catch (caught) {
      setActionError(getErrorMessage(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button onClick={onBack}>Retour à la liste</Button>
        {review ? (
          <Button onClick={() => setModalOpen(true)} variant={review.status === 'published' ? 'danger' : 'primary'}>
            {review.status === 'published' ? 'Masquer l’avis' : 'Restaurer l’avis'}
          </Button>
        ) : null}
      </div>
      {error ? <ErrorMessage message={error} /> : null}
      {!review ? <LoadingState message="Chargement de l’avis…" /> : (
        <>
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{review.service?.title ?? 'Service indisponible'}</p>
                <h1 className="mt-1 text-2xl font-bold text-slate-950">Avis de {review.author?.displayName ?? 'Compte indisponible'}</h1>
                <p className="mt-1 text-sm text-slate-500">pour {review.targetUser?.displayName ?? 'Compte indisponible'}</p>
              </div>
              <div className="flex items-center gap-2"><strong className="text-xl text-amber-700">{review.rating}/5</strong><AdminBadge tone={review.status === 'published' ? 'emerald' : 'amber'}>{statusLabels[review.status]}</AdminBadge></div>
            </div>
            <p className="mt-5 whitespace-pre-line rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">{review.comment || 'Avis sans commentaire.'}</p>
            {review.response ? <div className="mt-4 rounded-lg border border-slate-200 p-4"><strong className="text-sm text-slate-950">Réponse de la personne évaluée</strong><p className="mt-2 text-sm text-slate-600">{review.response.message}</p></div> : null}
          </Card>
          <Card>
            <h2 className="text-lg font-bold text-slate-950">Historique de modération</h2>
            <ol className="mt-4 grid gap-3">
              {review.moderationHistory.length ? review.moderationHistory.map((entry, index) => (
                <li className="rounded-lg border border-slate-200 p-3" key={`${entry.createdAt}-${index}`}>
                  <div className="flex justify-between gap-3 text-sm"><strong>{entry.action === 'hidden' ? 'Avis masqué' : 'Avis restauré'}</strong><span className="text-slate-500">{formatDate(entry.createdAt)}</span></div>
                  <p className="mt-1 text-sm text-slate-600">{entry.reason}</p>
                </li>
              )) : <p className="text-sm text-slate-500">Aucune action de modération.</p>}
            </ol>
          </Card>
        </>
      )}
      <Modal
        description="La note et le commentaire restent inchangés. Cette action est conservée dans l’historique."
        onClose={() => setModalOpen(false)}
        open={modalOpen}
        title={review?.status === 'published' ? 'Masquer cet avis' : 'Restaurer cet avis'}
      >
        <div className="grid gap-4">
          {actionError ? <ErrorMessage message={actionError} /> : null}
          <label className="grid gap-2 text-sm font-bold text-slate-900">Motif obligatoire<Textarea maxLength={500} onChange={(event) => setReason(event.target.value)} rows={4} value={reason} /></label>
          <div className="flex justify-end gap-2"><Button disabled={pending} onClick={() => setModalOpen(false)}>Annuler</Button><Button disabled={pending || !reason.trim()} onClick={() => void moderate()} variant={review?.status === 'published' ? 'danger' : 'primary'}>{pending ? 'Traitement…' : 'Confirmer'}</Button></div>
        </div>
      </Modal>
    </section>
  )
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  return 'Impossible de charger ou de modérer les avis.'
}
