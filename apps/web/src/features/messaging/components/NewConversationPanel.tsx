import { useState } from 'react';

import type { AuthUser } from '../../../api/auth';
import { EmptyState } from '../../../shared/components/EmptyState';

type NewConversationPanelProps = {
  neighbours: AuthUser[];
  onCancel: () => void;
  onCreate: (participantIds: string[], title?: string) => void;
};

export function NewConversationPanel({
  neighbours,
  onCancel,
  onCreate,
}: NewConversationPanelProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');

  function toggle(userId: string) {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  }

  function handleSubmit() {
    if (selectedIds.length === 0) {
      return;
    }

    onCreate(selectedIds, selectedIds.length > 1 ? title || undefined : undefined);
  }

  return (
    <div className="chat-widget-new-conversation">
      <div className="chat-widget-list-header">
        <button className="ghost-button" onClick={onCancel} type="button">
          Retour
        </button>
        <h3>Nouvelle discussion</h3>
      </div>

      {neighbours.length === 0 ? (
        <EmptyState message="Aucun voisin trouvé dans votre quartier." />
      ) : (
        <ul className="chat-widget-neighbours">
          {neighbours.map((neighbour) => (
            <li key={neighbour.id}>
              <label className="chat-widget-neighbour-item">
                <input
                  checked={selectedIds.includes(neighbour.id)}
                  onChange={() => toggle(neighbour.id)}
                  type="checkbox"
                />
                <span>{neighbour.displayName}</span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {selectedIds.length > 1 ? (
        <input
          className="chat-widget-group-title"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Nom du groupe (optionnel)"
          type="text"
          value={title}
        />
      ) : null}

      <button
        className="primary-button"
        disabled={selectedIds.length === 0}
        onClick={handleSubmit}
        type="button"
      >
        {selectedIds.length > 1 ? 'Créer le groupe' : 'Démarrer la discussion'}
      </button>
    </div>
  );
}
