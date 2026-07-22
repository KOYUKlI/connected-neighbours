import { PageContainer } from '../../components/layout/PageContainer';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs, type TabItem } from '../../components/ui/Tabs';
import { IncidentsPanel } from '../incidents/IncidentsPanel';
import { useLocalLifePage, type LocalTab } from './hooks/useLocalLifePage';

const tabs: TabItem<LocalTab>[] = [
  { id: 'events', label: 'Événements' },
  { id: 'votes', label: 'Votes' },
  { id: 'incidents', label: 'Incidents' },
  { id: 'map', label: 'Carte' },
];

export function LocalLifePage() {
  const { activeTab, handleChangeTab } = useLocalLifePage();

  return (
    <PageContainer className="grid gap-6">
      <PageHeader
        description="Participez aux rendez-vous, décisions et signalements de votre quartier."
        title="Vie locale"
      />

      <Tabs items={tabs} label="Vie locale" onChange={handleChangeTab} value={activeTab} />

      {activeTab === 'events' ? (
        <EmptyState
          icon="calendar"
          message="Les événements de quartier seront proposés dans un prochain lot."
          title="Bientôt disponible"
        />
      ) : null}

      {activeTab === 'votes' ? (
        <EmptyState
          icon="check"
          message="Les votes de quartier seront proposés dans un prochain lot."
          title="Bientôt disponible"
        />
      ) : null}

      {activeTab === 'incidents' ? <IncidentsPanel /> : null}

      {activeTab === 'map' ? (
        <EmptyState
          icon="map-pin"
          message="La carte du quartier sera proposée dans un prochain lot."
          title="Bientôt disponible"
        />
      ) : null}
    </PageContainer>
  );
}
