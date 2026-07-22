import { useState } from 'react';

import { formatInitials } from '../../utils/format';

export function Avatar({
  className = 'size-12',
  name,
  url,
}: {
  className?: string;
  name: string;
  url?: string | null;
}) {
  if (url) return <AvatarImage className={className} key={url} name={name} url={url} />;

  return (
    <span
      aria-label={`Initiales de ${name}`}
      className={`${className} grid shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-extrabold text-emerald-800`}
    >
      {formatInitials(name)}
    </span>
  );
}

function AvatarImage({ className, name, url }: { className: string; name: string; url: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        aria-label={`Initiales de ${name}`}
        className={`${className} grid shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-extrabold text-emerald-800`}
      >
        {formatInitials(name)}
      </span>
    );
  }
  return (
    <img
      alt={`Avatar de ${name}`}
      className={`${className} shrink-0 rounded-full object-cover`}
      onError={() => setFailed(true)}
      src={url}
    />
  );
}
