import { useMemo, useState } from 'react';

import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { Icon } from '../ui/Icon';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

export type ServiceFilterValue = {
  category: string;
  payment: 'all' | 'free' | 'paid';
  query: string;
  sort: 'newest' | 'oldest' | 'price-asc' | 'price-desc';
  type: 'all' | 'request' | 'offer';
};

const emptyFilters: Omit<ServiceFilterValue, 'query' | 'sort'> = {
  category: 'all',
  payment: 'all',
  type: 'all',
};

export function ServiceFilters({
  categories,
  onChange,
  value,
}: {
  categories: string[];
  onChange: (value: ServiceFilterValue) => void;
  value: ServiceFilterValue;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const activeFilters = useMemo(() => [value.category !== 'all', value.type !== 'all', value.payment !== 'all'].filter(Boolean).length, [value]);

  function update<K extends keyof ServiceFilterValue>(key: K, nextValue: ServiceFilterValue[K]) {
    onChange({ ...value, [key]: nextValue });
  }

  function clearFilter(key: 'category' | 'payment' | 'type') {
    onChange({ ...value, [key]: emptyFilters[key] });
  }

  function openDrawer() {
    setDraft(value);
    setDrawerOpen(true);
  }

  const chips = [
    value.type !== 'all' ? { key: 'type' as const, label: value.type === 'request' ? 'Demandes' : 'Offres' } : null,
    value.category !== 'all' ? { key: 'category' as const, label: value.category } : null,
    value.payment !== 'all' ? { key: 'payment' as const, label: value.payment === 'paid' ? 'Services payants' : 'Services gratuits' } : null,
  ].filter((chip): chip is NonNullable<typeof chip> => chip !== null);

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-[minmax(16rem,1fr)_repeat(3,minmax(9rem,0.45fr))]">
        <label className="relative block">
          <span className="sr-only">Rechercher un service</span>
          <Icon className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" name="search" />
          <Input className="pl-10" onChange={(event) => update('query', event.target.value)} placeholder="Rechercher un service…" type="search" value={value.query} />
        </label>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2 md:hidden">
          <Button className="w-full" onClick={openDrawer} variant="secondary"><Icon className="size-4" name="filter" /> Filtres{activeFilters > 0 ? ` (${activeFilters})` : ''}</Button>
          <label><span className="sr-only">Trier</span><Select onChange={(event) => update('sort', event.target.value as ServiceFilterValue['sort'])} value={value.sort}><option value="newest">Plus récents</option><option value="oldest">Plus anciens</option><option value="price-asc">Points croissants</option><option value="price-desc">Points décroissants</option></Select></label>
        </div>
        <label className="hidden md:block"><span className="sr-only">Type</span><Select onChange={(event) => update('type', event.target.value as ServiceFilterValue['type'])} value={value.type}><option value="all">Demandes et offres</option><option value="request">Demandes</option><option value="offer">Offres</option></Select></label>
        <label className="hidden md:block"><span className="sr-only">Catégorie</span><Select onChange={(event) => update('category', event.target.value)} value={value.category}><option value="all">Toutes les catégories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</Select></label>
        <label className="hidden md:block"><span className="sr-only">Trier</span><Select onChange={(event) => update('sort', event.target.value as ServiceFilterValue['sort'])} value={value.sort}><option value="newest">Plus récents</option><option value="oldest">Plus anciens</option><option value="price-asc">Points croissants</option><option value="price-desc">Points décroissants</option></Select></label>
      </div>
      {chips.length > 0 ? (
        <div aria-label="Filtres actifs" className="flex flex-wrap gap-2">
          {chips.map((chip) => <button className="inline-flex min-h-9 items-center gap-1 rounded-full bg-emerald-50 px-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" key={chip.key} onClick={() => clearFilter(chip.key)} type="button">{chip.label}<Icon className="size-3.5" name="close" /></button>)}
        </div>
      ) : null}
      <Drawer description="Affinez les services affichés dans votre quartier." onClose={() => setDrawerOpen(false)} open={drawerOpen} title="Filtres">
        <div className="grid gap-5">
          <label className="grid gap-2 text-sm font-bold text-slate-900">Type<Select onChange={(event) => setDraft({ ...draft, type: event.target.value as ServiceFilterValue['type'] })} value={draft.type}><option value="all">Demandes et offres</option><option value="request">Demandes</option><option value="offer">Offres</option></Select></label>
          <label className="grid gap-2 text-sm font-bold text-slate-900">Catégorie<Select onChange={(event) => setDraft({ ...draft, category: event.target.value })} value={draft.category}><option value="all">Toutes les catégories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</Select></label>
          <label className="grid gap-2 text-sm font-bold text-slate-900">Tarification<Select onChange={(event) => setDraft({ ...draft, payment: event.target.value as ServiceFilterValue['payment'] })} value={draft.payment}><option value="all">Gratuits et payants</option><option value="free">Gratuits</option><option value="paid">Payants</option></Select></label>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button onClick={() => setDraft({ ...draft, ...emptyFilters })} variant="ghost">Réinitialiser</Button>
            <Button onClick={() => { onChange(draft); setDrawerOpen(false); }} variant="primary">Appliquer</Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
