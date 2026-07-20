import { useState } from 'react';

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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="install-command">
      <pre>
        <code>{command}</code>
      </pre>
      <button className="secondary-button" type="button" onClick={handleCopy}>
        {copied ? 'Copie !' : 'Copier'}
      </button>
    </div>
  );
}

function OsTabs({ activeOs, onChange }: { activeOs: Os; onChange: (os: Os) => void }) {
  return (
    <div className="install-tabs" role="tablist">
      {OS_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeOs === tab.id}
          className={`install-tab${activeOs === tab.id ? ' install-tab-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function InstallPage() {
  const [activeOs, setActiveOs] = useState<Os>('linux');

  const activeTab = OS_TABS.find((tab) => tab.id === activeOs)!;
  const jarFileName = activeTab.jarPath.split('/').pop();

  return (
    <div className="install-page">
      <div className="install-card">
        <h2>Application desktop admin</h2>
        <p>
          Client JavaFX pour la gestion des incidents et alertes en local, avec
          synchronisation vers ce back-office.
        </p>

        <OsTabs activeOs={activeOs} onChange={setActiveOs} />

        <div className="install-downloads">
          <a className="primary-button" download href={activeTab.jarPath}>
            Telecharger {jarFileName}
          </a>
          {activeOs === 'windows' && (
            <button className="secondary-button" type="button" disabled>
              Telecharger admin-desktop.exe - bientot disponible
            </button>
          )}
        </div>
      </div>

      <div className="install-card">
        <h3>Prerequis</h3>
        <p>Java 21 ou superieur doit etre installe sur le poste.</p>

        <CopyableCommand command={activeTab.javaInstallCommand} />
      </div>

      <div className="install-card">
        <h3>Installation</h3>

        <ol className="install-steps">
          <li>Telechargez <code>{jarFileName}</code> ci-dessus.</li>
          <li>Ouvrez un terminal et lancez la commande ci-dessous :</li>
        </ol>

        <CopyableCommand command={activeTab.launchCommand} />

        <ol className="install-steps" start={3}>
          <li>Connectez-vous avec vos identifiants administrateur habituels.</li>
        </ol>
      </div>
    </div>
  );
}
