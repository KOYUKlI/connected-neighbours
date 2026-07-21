import { Link } from 'react-router-dom';

import { PageContainer } from '../components/layout/PageContainer';
import { buttonStyles } from '../components/ui/buttonStyles';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import type { IconName } from '../components/ui/Icon';

export function ComingSoonPage({ description, icon, title }: { description: string; icon: IconName; title: string }) {
  return (
    <PageContainer className="grid gap-6">
      <PageHeader description={description} title={title} />
      <EmptyState action={<Link className={buttonStyles('primary')} to="/services">Découvrir les services</Link>} icon={icon} message="Cette fonctionnalité fait partie d’un prochain lot. Les liens restent actifs pour conserver une navigation cohérente." title="Fonctionnalité en préparation" />
    </PageContainer>
  );
}
