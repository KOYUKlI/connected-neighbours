import { EmptyState } from '../../shared/components/EmptyState';
import { useRgpdPage } from './hooks/useRgpdPage';
import { RgpdSummaryCard } from './components/RgpdSummaryCard';
import {
  formatRgpdSectionDetail,
  formatRgpdSectionValue,
  getRgpdSummarySections,
  rgpdSectionLabels,
} from './utils';

export function RgpdPage() {
  const { rgpdExport, isPending, error, onExport } = useRgpdPage();
  const sections = rgpdExport ? getRgpdSummarySections(rgpdExport) : [];

  return (
    <div className="stack">
      <section className="panel rgpd-panel">
        <div>
          <h2>Exporter mes données</h2>
          <p>
            Cet écran affiche les données personnelles récupérées depuis l’API RGPD.
            Les identifiants techniques sont normalisés et les mots de passe ne sont
            jamais exportés.
          </p>
        </div>
        <button className="primary-button" disabled={isPending} onClick={() => void onExport()} type="button">
          {isPending ? 'Export...' : 'Exporter'}
        </button>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}

      {rgpdExport ? (
        <>
          <div className="dashboard-grid">
            {sections.map(([key, value]) => (
              <RgpdSummaryCard
                detail={formatRgpdSectionDetail(key, value)}
                key={key}
                label={rgpdSectionLabels[key] ?? key}
                value={formatRgpdSectionValue(key, value)}
              />
            ))}
          </div>
          <details className="json-panel" open>
            <summary>JSON exporté complet</summary>
            <pre>{JSON.stringify(rgpdExport, null, 2)}</pre>
          </details>
        </>
      ) : (
        <EmptyState message="Aucun export RGPD charge." />
      )}
    </div>
  );
}
