import { useState, type FormEvent } from 'react'

import type { DisputeOutcome, DisputeReason, OpenDisputeInput } from '../../api/disputes'
import {
  disputeOutcomeLabels,
  disputeReasonLabels,
} from '../../features/disputes/disputePresentation'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'

export function OpenDisputeModal({
  onClose,
  onSubmit,
  open,
  pending,
  reservedPoints,
}: {
  onClose: () => void
  onSubmit: (input: OpenDisputeInput) => Promise<boolean>
  open: boolean
  pending: boolean
  reservedPoints: number
}) {
  const [reason, setReason] = useState<DisputeReason>('service_quality')
  const [requestedOutcome, setRequestedOutcome] = useState<DisputeOutcome>('requester_refund')
  const [description, setDescription] = useState('')


  function resetAndClose() {
    setReason('service_quality')
    setRequestedOutcome('requester_refund')
    setDescription('')
    onClose()
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const saved = await onSubmit({
      reason,
      description: description.trim(),
      requestedOutcome,
    })
    if (saved) resetAndClose()
  }

  return (
    <Modal
      description="La modération examinera les preuves des deux parties avant toute décision."
      onClose={resetAndClose}
      open={open}
      title="Ouvrir un litige"
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <strong className="block">Les {reservedPoints} points resteront gelés.</strong>
          Les transitions normales du service seront suspendues jusqu’à la décision.
        </div>
        <label className="grid gap-2 text-sm font-bold text-slate-900">
          Motif
          <Select
            onChange={(event) => setReason(event.target.value as DisputeReason)}
            value={reason}
          >
            {Object.entries(disputeReasonLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-900">
          Résultat souhaité
          <Select
            onChange={(event) => setRequestedOutcome(event.target.value as DisputeOutcome)}
            value={requestedOutcome}
          >
            {Object.entries(disputeOutcomeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-900">
          Décrivez précisément le problème
          <Textarea
            maxLength={2000}
            minLength={20}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Expliquez les faits, les échanges déjà réalisés et le résultat attendu."
            required
            rows={6}
            value={description}
          />
          <span className="text-xs font-normal text-slate-500">
            {description.length}/2000 caractères
          </span>
        </label>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button disabled={pending} onClick={resetAndClose} variant="ghost">
            Annuler
          </Button>
          <Button
            disabled={pending || description.trim().length < 20}
            type="submit"
            variant="danger"
          >
            {pending ? 'Ouverture…' : 'Ouvrir et geler les points'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
