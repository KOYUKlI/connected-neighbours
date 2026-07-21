import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  fetchAdminDisputes,
  type AdminDisputeReason,
  type AdminDisputeStatus,
  type AdminDisputeSummary,
} from '../../api/disputes'
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
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { LoadingState } from '../../components/ui/LoadingState'
import { DisputeDetailPanel } from './DisputeDetailPanel'

type DisputeTab = 'all' | 'open' | 'under_review' | 'resolved' | 'closed'

const statusLabels: Record<AdminDisputeStatus, string> = {
  open: 'Ouvert',
  under_review: 'En revue',
  resolved: 'Résolu',
  closed: 'Clôturé',
}
const reasonLabels: Record<AdminDisputeReason, string> = {
  service_not_completed: 'Service non réalisé',
  service_quality: 'Qualité',
  no_show: 'Absence',
  incorrect_description: 'Description inexacte',
  unsafe_behavior: 'Comportement dangereux',
  payment_disagreement: 'Paiement',
  other: 'Autre',
}

export function DisputesPage() {
  const [items, setItems] = useState<AdminDisputeSummary[]>([])
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const response = await fetchAdminDisputes()
      setItems(response.items)
    } catch (caught) {
      setError(getErrorMessage(caught))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshKey
    void load()
  }, [load, refreshKey])

  if (selectedDisputeId) {
    return (
      <DisputeDetailPanel
        disputeId={selectedDisputeId}
        onBack={() => setSelectedDisputeId(null)}
        onChanged={() => setRefreshKey((value) => value + 1)}
      />
    )
  }

  if (loading) return <LoadingState message="Chargement des litiges…" />

  return (
    <DisputesList
      error={error}
      items={items}
      onRefresh={() => setRefreshKey((value) => value + 1)}
      onSelect={setSelectedDisputeId}
    />
  )
}

function DisputesList({
  error,
  items,
  onRefresh,
  onSelect,
}: {
  error: string | null
  items: AdminDisputeSummary[]
  onRefresh: () => void
  onSelect: (id: string) => void
}) {
  const [activeTab, setActiveTab] = useState<DisputeTab>('all')
  const [reason, setReason] = useState<'all' | AdminDisputeReason>('all')
  const [assignment, setAssignment] = useState<'all' | 'assigned' | 'unassigned'>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [sort, setSort] = useState<AdminSortState | null>({
    direction: 'desc',
    key: 'openedAt',
  })

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const matchesTab = activeTab === 'all' || item.status === activeTab
        const matchesReason = reason === 'all' || item.reason === reason
        const matchesAssignment =
          assignment === 'all' ||
          (assignment === 'assigned' && Boolean(item.assignedModerator)) ||
          (assignment === 'unassigned' && !item.assignedModerator)
        return (
          matchesTab &&
          matchesReason &&
          matchesAssignment &&
          matchesSearch(
            query,
            item.service?.title,
            reasonLabels[item.reason],
            item.requester?.displayName,
            item.provider?.displayName,
            item.assignedModerator?.displayName,
          )
        )
      }),
    [activeTab, assignment, items, query, reason],
  )

  const sorted = useMemo(
    () =>
      sortAdminRows(filtered, sort, {
        openedAt: (item) => Date.parse(item.openedAt),
        points: (item) => item.reservedPoints,
        reason: (item) => reasonLabels[item.reason],
        service: (item) => item.service?.title,
        status: (item) => statusLabels[item.status],
      }),
    [filtered, sort],
  )
  const rows = paginateRows(sorted, page, pageSize)


  function resetPageAndSelection() {
    setPage(1)
    setSelectedRowKeys([])
  }
  function resetFilters() {
    setActiveTab('all')
    setReason('all')
    setAssignment('all')
    setQuery('')
    resetPageAndSelection()
  }

  return (
    <section className="grid gap-4">
      <AdminListHeader
        action={
          <Button onClick={onRefresh} variant="ghost">
            Actualiser
          </Button>
        }
        description="Examinez les contestations, les preuves et les points gelés avant décision."
        title="Litiges"
      />

      {error ? <ErrorMessage message={error} /> : null}

      <AdminListTabs
        items={[
          { id: 'all', label: 'Tous', count: items.length },
          {
            id: 'open',
            label: 'Ouverts',
            count: items.filter((item) => item.status === 'open').length,
          },
          {
            id: 'under_review',
            label: 'En revue',
            count: items.filter((item) => item.status === 'under_review').length,
          },
          {
            id: 'resolved',
            label: 'Résolus',
            count: items.filter((item) => item.status === 'resolved').length,
          },
          {
            id: 'closed',
            label: 'Clôturés',
            count: items.filter((item) => item.status === 'closed').length,
          },
        ]}
        onChange={(value) => {
          setActiveTab(value)
          resetPageAndSelection()
        }}
        value={activeTab}
      />

      <AdminListToolbar>
        <AdminSearchInput
          onChange={(value) => {
            setQuery(value)
            resetPageAndSelection()
          }}
          placeholder="Rechercher un service ou une partie"
          value={query}
        />
        <AdminSelect
          label="Motif"
          onChange={(value) => {
            setReason(value as typeof reason)
            resetPageAndSelection()
          }}
          value={reason}
        >
          <option value="all">Tous les motifs</option>
          {Object.entries(reasonLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect
          label="Assignation"
          onChange={(value) => {
            setAssignment(value as typeof assignment)
            resetPageAndSelection()
          }}
          value={assignment}
        >
          <option value="all">Toutes les assignations</option>
          <option value="assigned">Assignés</option>
          <option value="unassigned">Non assignés</option>
        </AdminSelect>
        <AdminResetButton onClick={resetFilters} />
      </AdminListToolbar>

      <AdminListTable
        columns={[
          {
            header: 'Service',
            render: (item) => (
              <div className="min-w-0">
                <strong className="block truncate text-slate-950">
                  {item.service?.title ?? 'Service indisponible'}
                </strong>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {reasonLabels[item.reason]}
                </span>
              </div>
            ),
            sortKey: 'service',
            width: '24%',
          },
          {
            header: 'Parties',
            render: (item) => (
              <div className="min-w-0 text-sm">
                <span className="block truncate">
                  {item.requester?.displayName ?? 'Demandeur inconnu'}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {item.provider?.displayName ?? 'Prestataire inconnu'}
                </span>
              </div>
            ),
            width: '19%',
          },
          {
            className: 'whitespace-nowrap text-right',
            header: 'Gelés',
            render: (item) => item.reservedPoints + ' pts',
            sortKey: 'points',
            width: '9%',
          },
          {
            header: 'Statut',
            render: (item) => (
              <AdminBadge tone={getStatusTone(item.status)}>{statusLabels[item.status]}</AdminBadge>
            ),
            sortKey: 'status',
            width: '12%',
          },
          {
            header: 'Modérateur',
            render: (item) => (
              <span className="block truncate">
                {item.assignedModerator?.displayName ?? 'Non assigné'}
              </span>
            ),
            width: '15%',
          },
          {
            className: 'whitespace-nowrap',
            header: 'Ouverture',
            render: (item) => formatDate(item.openedAt),
            sortKey: 'openedAt',
            width: '12%',
          },
          {
            header: 'Actions',
            render: (item) => (
              <AdminActionMenu
                items={[
                  {
                    label: 'Consulter le dossier',
                    onClick: () => onSelect(item.id),
                  },
                ]}
              />
            ),
            width: '9%',
          },
        ]}
        emptyDescription="Les litiges ouverts par les parties apparaîtront ici."
        emptyMessage="Aucun litige trouvé"
        getRowKey={(item) => item.id}
        minWidth="980px"
        onPageChange={(value) => {
          setPage(value)
          setSelectedRowKeys([])
        }}
        onPageSizeChange={(value) => {
          setPageSize(value)
          resetPageAndSelection()
        }}
        onRowClick={(item) => onSelect(item.id)}
        onSelectedRowKeysChange={setSelectedRowKeys}
        onSortChange={(nextSort) => {
          setSort(nextSort)
          setPage(1)
          setSelectedRowKeys([])
        }}
        page={page}
        pageSize={pageSize}
        rows={rows}
        selectedRowKeys={selectedRowKeys}
        sort={sort}
        summaryLabel={sorted.length + ' litiges'}
        tableLabel={activeTab === 'all' ? 'Tous' : statusLabels[activeTab]}
        total={sorted.length}
      />
    </section>
  )
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function getStatusTone(status: AdminDisputeStatus) {
  if (status === 'resolved' || status === 'closed') return 'emerald' as const
  if (status === 'under_review') return 'blue' as const
  return 'amber' as const
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  return 'Impossible de charger les litiges.'
}
