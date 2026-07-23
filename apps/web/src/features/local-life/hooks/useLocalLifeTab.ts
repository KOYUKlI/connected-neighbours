import { useSearchParams } from 'react-router-dom';

export type LocalLifeTab = 'events' | 'votes' | 'incidents';

export function useLocalLifeTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as LocalLifeTab | null) ?? 'events';

  function handleChangeTab(nextTab: LocalLifeTab) {
    setSearchParams({ tab: nextTab });
  }

  return { activeTab, handleChangeTab };
}
