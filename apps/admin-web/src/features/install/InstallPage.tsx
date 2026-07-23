import { useState } from 'react';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Tabs } from '../../components/ui/Tabs';

type Os = 'linux' | 'windows';

const OS_TABS: {
  id: Os;
  label: string;
  jarPath: string;
  javaInstallCommand: string;
  launchCommand: string;
}[] = [
  {
    id: 'linux',
    label: 'Linux',
    jarPath: '/downloads/admin-desktop-linux.jar',
    javaInstallCommand: 'sudo apt install openjdk-21-jdk',
    launchCommand: 'java -jar admin-desktop-linux.jar',
  },
  {
    id: 'windows',
    label: 'Windows',
    jarPath: '/downloads/admin-desktop-win.jar',
    javaInstallCommand: 'winget install --id EclipseAdoptium.Temurin.21.JDK -e',
    launchCommand: 'java -jar admin-desktop-win.jar',
  },
];

function CopyableCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-pre text-sm text-slate-950">
        {command}
      </code>
      <Button onClick={() => void handleCopy()} size="sm" variant="secondary">
        {copied ? 'Copié !' : 'Copier'}
      </Button>
    </div>
  );
}

export function InstallPage() {
  const [activeOs, setActiveOs] = useState<Os>('linux');

  const activeTab = OS_TABS.find((tab) => tab.id === activeOs)!;
  const jarFileName = activeTab.jarPath.split('/').pop();

  return (
    <div className="grid gap-4">
      <PageHeader
        description="Client JavaFX pour la gestion des incidents et alertes en local, avec synchronisation vers ce back-office."
        eyebrow="Administration / Application desktop"
        title="Télécharger l’application desktop"
      />

      <Card className="grid gap-4">
        <Tabs
          items={OS_TABS.map((tab) => ({ id: tab.id, label: tab.label }))}
          onChange={setActiveOs}
          value={activeOs}
        />

        <div className="flex flex-wrap items-center gap-3">
          <a
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-blue-700"
            download
            href={activeTab.jarPath}
          >
            Télécharger {jarFileName}
          </a>
          {activeOs === 'windows' ? (
            <Button disabled variant="ghost">
              Installeur .exe — bientôt disponible
            </Button>
          ) : null}
        </div>
      </Card>

      <Card className="grid gap-3">
        <SectionHeader
          description="Java 21 ou supérieur doit être installé sur le poste."
          title="Prérequis"
        />
        <CopyableCommand command={activeTab.javaInstallCommand} />
      </Card>

      <Card className="grid gap-3">
        <SectionHeader
          description="Lancez le client une fois le fichier téléchargé."
          title="Installation"
        />
        <ol className="grid list-decimal gap-2 pl-5 text-sm text-slate-600">
          <li>
            Téléchargez{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-950">
              {jarFileName}
            </code>{' '}
            ci-dessus.
          </li>
          <li>Ouvrez un terminal et lancez la commande ci-dessous :</li>
        </ol>
        <CopyableCommand command={activeTab.launchCommand} />
        <ol className="grid list-decimal gap-2 pl-5 text-sm text-slate-600" start={3}>
          <li>Connectez-vous avec vos identifiants administrateur habituels.</li>
        </ol>
      </Card>
    </div>
  );
}
