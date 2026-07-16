const JAR_PATH = '/downloads/admin-desktop.jar';

export function InstallPage() {
  return (
    <div className="install-page">
      <div className="install-card">
        <h2>Application desktop admin</h2>
        <p>
          Client JavaFX pour la gestion des incidents et alertes en local, avec
          synchronisation vers ce back-office.
        </p>
        <a className="primary-button" download href={JAR_PATH}>
          Telecharger admin-desktop.jar
        </a>
      </div>

      <div className="install-card">
        <h3>Prerequis</h3>
        <p>Java 21 ou superieur doit etre installe sur le poste.</p>
      </div>

      <div className="install-card">
        <h3>Installation</h3>
        <ol className="install-steps">
          <li>Telechargez <code>admin-desktop.jar</code> ci-dessus.</li>
          <li>
            Lancez-le depuis un terminal : <code>java -jar admin-desktop.jar</code>
          </li>
          <li>Connectez-vous avec vos identifiants administrateur habituels.</li>
        </ol>
      </div>
    </div>
  );
}
