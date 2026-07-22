import { useSearchParams } from 'react-router-dom';

export type LocalTab = 'events' | 'votes' | 'incidents' | 'map';

export function useLocalLifePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as LocalTab | null) ?? 'incidents';

  function handleChangeTab(nextTab: LocalTab) {
    setSearchParams({ tab: nextTab });
  }

  return { activeTab, handleChangeTab };
}
