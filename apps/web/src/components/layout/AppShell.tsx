import { useEffect, useState, type ReactNode } from 'react';

import { getPointBalance, type PointBalance } from '../../api/points';
import { useAuth } from '../../auth/useAuth';
import { MobileBottomNavigation } from '../navigation/MobileBottomNavigation';
import { ResidentHeader } from './ResidentHeader';

export function AppShell({ children }: { children: ReactNode }) {
  const { logout, user } = useAuth();
  const [balance, setBalance] = useState<PointBalance | null>(null);

  useEffect(() => {
    let active = true;
    getPointBalance()
      .then((result) => { if (active) setBalance(result); })
      .catch(() => { if (active) setBalance(null); });
    return () => { active = false; };
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700">
      <ResidentHeader
        onLogout={logout}
        points={balance?.availablePoints}
        reservedPoints={balance?.reservedPoints}
        user={user}
      />
      <main className="min-h-[calc(100vh-4rem)] pb-[calc(5rem+env(safe-area-inset-bottom))] lg:min-h-[calc(100vh-4.5rem)] lg:pb-0">{children}</main>
      <MobileBottomNavigation />
    </div>
  );
}
