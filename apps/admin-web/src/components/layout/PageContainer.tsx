import type { ReactNode } from 'react';

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <main className="min-w-0 flex-1 px-8 py-5 max-[760px]:px-4 max-[760px]:py-4">
      <div className="mx-auto grid w-full max-w-[1240px] gap-4">{children}</div>
    </main>
  );
}
