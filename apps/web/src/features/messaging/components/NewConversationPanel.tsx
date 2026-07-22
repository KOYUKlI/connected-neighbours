import { useState } from 'react';

import type { AuthUser } from '../../../api/auth';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Input } from '../../../components/ui/Input';
import { ConversationAvatar } from './ConversationAvatar';

type NewConversationPanelProps = {
  neighbours: AuthUser[];
  onCreate: (participantIds: string[], title?: string) => void;
};

export function NewConversationPanel({ neighbours, onCreate }: NewConversationPanelProps) {
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
    <div className="flex flex-col gap-4">
      {neighbours.length === 0 ? (
        <EmptyState icon="users" message="Aucun voisin trouvé dans votre quartier." title="Personne à contacter" />
      ) : (
        <ul className="max-h-80 space-y-1 overflow-y-auto">
          {neighbours.map((neighbour) => (
            <li key={neighbour.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                <input
                  checked={selectedIds.includes(neighbour.id)}
                  className="size-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-200"
                  onChange={() => toggle(neighbour.id)}
                  type="checkbox"
                />
                <ConversationAvatar name={neighbour.displayName ?? neighbour.email} seed={neighbour.id} />
                <span className="text-sm font-semibold text-slate-900">
                  {neighbour.displayName ?? neighbour.email}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {selectedIds.length > 1 ? (
        <Input
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Nom du groupe (optionnel)"
          type="text"
          value={title}
        />
      ) : null}

      <Button disabled={selectedIds.length === 0} onClick={handleSubmit} variant="primary">
        {selectedIds.length > 1 ? 'Créer le groupe' : 'Démarrer la discussion'}
      </Button>
    </div>
  );
}
