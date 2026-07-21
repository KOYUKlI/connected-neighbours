import type {
  DisputeOutcome,
  DisputeReason,
  DisputeResolutionType,
  DisputeStatus,
} from '../../api/disputes'

export const disputeStatusLabels: Record<DisputeStatus, string> = {
  open: 'Ouvert',
  under_review: 'En cours de revue',
  resolved: 'Résolu',
  closed: 'Clôturé',
}

export const disputeReasonLabels: Record<DisputeReason, string> = {
  service_not_completed: 'Service non réalisé',
  service_quality: 'Qualité de la prestation',
  no_show: 'Absence au rendez-vous',
  incorrect_description: 'Description inexacte',
  unsafe_behavior: 'Comportement dangereux',
  payment_disagreement: 'Désaccord sur le paiement',
  other: 'Autre motif',
}

export const disputeOutcomeLabels: Record<DisputeOutcome, string> = {
  provider_payment: 'Paiement du prestataire',
  requester_refund: 'Remboursement du demandeur',
  split: 'Partage des points',
  other: 'Autre solution',
}

export const disputeResolutionLabels: Record<DisputeResolutionType, string> = {
  provider_payment: 'Paiement intégral du prestataire',
  requester_refund: 'Remboursement intégral du demandeur',
  split: 'Partage des points',
}

export function getDisputeTone(status: DisputeStatus) {
  if (status === 'resolved' || status === 'closed') return 'success' as const
  if (status === 'under_review') return 'info' as const
  return 'warning' as const
}
