import { useMemo, useState, type FormEvent } from 'react'

import type { AdminDisputeResolutionType } from '../../api/disputes'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'

export function DisputeResolutionModal({
  onClose,
  onSubmit,
  open,
  pending,
  reservedPoints,
}: {
  onClose: () => void
  onSubmit: (input: {
    type: AdminDisputeResolutionType
    justification: string
    providerPoints?: number
    requesterPoints?: number
  }) => Promise<boolean>
  open: boolean
  pending: boolean
  reservedPoints: number
}) {
  const [type, setType] = useState<AdminDisputeResolutionType>('provider_payment')
  const [justification, setJustification] = useState('')
  const [providerPoints, setProviderPoints] = useState(reservedPoints)
  const [requesterPoints, setRequesterPoints] = useState(0)


  const total = providerPoints + requesterPoints
  const splitValid = type !== 'split' || total === reservedPoints
  const summary = useMemo(() => {
    if (type === 'provider_payment') {
      return {
        provider: reservedPoints,
        requester: 0,
        label: 'Paiement intégral au prestataire',
      }
    }
    if (type === 'requester_refund') {
      return {
        provider: 0,
        requester: reservedPoints,
        label: 'Remboursement intégral au demandeur',
      }
    }
    return {
      provider: providerPoints,
      requester: requesterPoints,
      label: 'Partage des points',
    }
  }, [providerPoints, requesterPoints, reservedPoints, type])

  function resetAndClose() {
    setType('provider_payment')
    setJustification('')
    setProviderPoints(reservedPoints)
    setRequesterPoints(0)
    onClose()
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!splitValid) return
    const saved = await onSubmit({
      type,
      justification: justification.trim(),
      ...(type === 'split' ? { providerPoints, requesterPoints } : {}),
    })
    if (saved) resetAndClose()
  }

  return (
    <Modal
      description="Cette décision exécute un mouvement de points définitif et auditable."
      onClose={resetAndClose}
      open={open}
      title="Résoudre le litige"
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-bold text-slate-900">
          Décision
          <Select
            onChange={(event) => setType(event.target.value as AdminDisputeResolutionType)}
            value={type}
          >
            <option value="provider_payment">Paiement intégral du prestataire</option>
            <option value="requester_refund">Remboursement intégral du demandeur</option>
            <option value="split">Partage</option>
          </Select>
        </label>

        {type === 'split' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-slate-900">
              Part prestataire
              <input
                className="min-h-10 rounded-lg border border-slate-200 px-3 focus:outline focus:outline-4 focus:outline-blue-200"
                min={0}
                onChange={(event) => setProviderPoints(Number(event.target.value))}
                type="number"
                value={providerPoints}
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-900">
              Part demandeur
              <input
                className="min-h-10 rounded-lg border border-slate-200 px-3 focus:outline focus:outline-4 focus:outline-blue-200"
                min={0}
                onChange={(event) => setRequesterPoints(Number(event.target.value))}
                type="number"
                value={requesterPoints}
              />
            </label>
          </div>
        ) : null}

        {type === 'split' && !splitValid ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            La somme doit être exactement égale à {reservedPoints} points (actuellement {total}).
          </p>
        ) : null}

        <label className="grid gap-2 text-sm font-bold text-slate-900">
          Justification
          <Textarea
            maxLength={2000}
            minLength={10}
            onChange={(event) => setJustification(event.target.value)}
            placeholder="Expliquez les éléments retenus et la décision."
            required
            rows={5}
            value={justification}
          />
        </label>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
          <strong className="block">{summary.label}</strong>
          <span className="mt-1 block">
            Prestataire : {summary.provider} points · Demandeur : {summary.requester} points
          </span>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button disabled={pending} onClick={resetAndClose}>
            Annuler
          </Button>
          <Button
            disabled={pending || !splitValid || justification.trim().length < 10}
            type="submit"
            variant="danger"
          >
            {pending ? 'Traitement…' : 'Confirmer la décision'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
