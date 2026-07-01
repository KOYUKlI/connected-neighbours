export function PageHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-extrabold uppercase text-blue-600">{eyebrow}</p>
      <h1 className="m-0 text-3xl font-extrabold leading-tight text-slate-950">{title}</h1>
    </div>
  );
}
