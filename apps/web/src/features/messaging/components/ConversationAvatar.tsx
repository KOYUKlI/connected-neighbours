import { formatInitials } from '../../../utils/format';

const palette = [
  'bg-blue-100 text-blue-800',
  'bg-rose-100 text-rose-800',
  'bg-amber-100 text-amber-800',
  'bg-emerald-100 text-emerald-800',
  'bg-violet-100 text-violet-800',
];

function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length];
}

export function ConversationAvatar({
  name,
  seed,
  size = 'md',
}: {
  name: string;
  seed: string;
  size?: 'md' | 'lg';
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-extrabold ${colorFor(seed)} ${
        size === 'lg' ? 'size-14 text-lg' : 'size-11 text-sm'
      }`}
    >
      {formatInitials(name)}
    </span>
  );
}
