import type { PointBalance } from '../../api/points';
import { Card } from './Card';
import { Icon } from './Icon';

export function PointsSummary({ balance }: { balance: PointBalance }) {
  return (
    <Card>
      <div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-slate-500">Mes points disponibles</p><p className="mt-1 text-3xl font-extrabold text-slate-950">{balance.availablePoints}</p></div><span className="grid size-10 place-items-center rounded-lg bg-amber-50 text-amber-700"><Icon className="size-5" name="coins" /></span></div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-sm"><div><dt className="text-slate-500">Réservés</dt><dd className="mt-1 font-extrabold text-slate-900">{balance.reservedPoints} pts</dd></div><div><dt className="text-slate-500">Solde total</dt><dd className="mt-1 font-extrabold text-slate-900">{balance.pointsBalance} pts</dd></div></dl>
    </Card>
  );
}
