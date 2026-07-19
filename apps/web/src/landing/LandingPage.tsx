import { Link } from 'react-router-dom';

import './Landing.css';

const categories = [
  {
    emoji: '🔧',
    title: 'Bricolage & réparations',
    description: 'Montage de meubles, petites réparations, dépannage express.',
  },
  {
    emoji: '🌱',
    title: 'Jardinage & extérieur',
    description: 'Tonte, taille, entretien du jardin ou des plantes du balcon.',
  },
  {
    emoji: '👶',
    title: 'Garde d’enfants',
    description: 'Baby-sitting ponctuel, sortie d’école, aide aux devoirs.',
  },
  {
    emoji: '🛒',
    title: 'Courses & livraisons',
    description: 'Un coup de main pour les courses ou un colis à récupérer.',
  },
  {
    emoji: '🐾',
    title: 'Garde d’animaux',
    description: 'Promenade de chien, nourrissage de chat pendant les vacances.',
  },
  {
    emoji: '📚',
    title: 'Cours & coaching',
    description: 'Soutien scolaire, langues, informatique, sport à domicile.',
  },
  {
    emoji: '🍳',
    title: 'Cuisine partagée',
    description: 'Plats faits maison, repas à partager entre voisins.',
  },
  {
    emoji: '💻',
    title: 'Aide numérique',
    description: 'Installation, dépannage informatique, prise en main d’un appareil.',
  },
];

const values = [
  {
    emoji: '🤝',
    title: 'Entraide locale',
    description:
      'Trouvez de l’aide ou proposez vos compétences directement dans votre quartier.',
  },
  {
    emoji: '📍',
    title: '100% de proximité',
    description:
      'Les services sont filtrés par quartier pour rester proche de chez vous.',
  },
  {
    emoji: '🔒',
    title: 'Échanges cadrés',
    description:
      'Contrats simples et système de points pour des échanges clairs et sereins.',
  },
  {
    emoji: '⭐',
    title: 'Confiance entre voisins',
    description: 'Profils, candidatures et suivi des échanges à chaque étape.',
  },
];

const steps = [
  {
    number: '1',
    title: 'Publiez',
    description:
      'Décrivez le service que vous proposez ou la demande que vous souhaitez publier dans votre quartier.',
  },
  {
    number: '2',
    title: 'Échangez',
    description:
      'Parcourez les annonces, candidatez et discutez avec vos voisins pour trouver le bon accord.',
  },
  {
    number: '3',
    title: 'Profitez',
    description:
      'Signez un contrat simple, réglez en points et profitez d’un service rendu près de chez vous.',
  },
];

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Link className="landing-brand" to="/">
          <span className="landing-brand-mark">CN</span>
          <span>Connected Neighbours</span>
        </Link>

        <nav className="landing-nav-links" aria-label="Navigation principale">
          <a href="#categories">Services</a>
          <a href="#comment-ca-marche">Comment ça marche</a>
          <a href="#pourquoi">Pourquoi nous</a>
        </nav>

        <Link className="landing-nav-cta" to="/app">
          Se connecter
        </Link>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="hero-eyebrow">Votre quartier, en mieux</p>
            <h1>
              Des services entre voisins,
              <br />à deux pas de chez vous
            </h1>
            <p className="hero-lead">
              Connected Neighbours met en relation les habitants d’un même
              quartier pour s’entraider au quotidien : bricolage, garde
              d’enfants, jardinage, cours, courses… et bien plus encore.
            </p>
            <div className="hero-actions">
              <a className="button-primary" href="#categories">
                Découvrir les services
              </a>
              <Link className="button-secondary" to="/app">
                Rejoindre mon quartier
              </Link>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-card hero-card-1">
              <span>🔧</span>
              <strong>Bricolage</strong>
              <p>Demande publiée · Quartier Centre</p>
            </div>
            <div className="hero-card hero-card-2">
              <span>🌱</span>
              <strong>Jardinage</strong>
              <p>3 voisins disponibles</p>
            </div>
            <div className="hero-card hero-card-3">
              <span>👶</span>
              <strong>Garde d’enfants</strong>
              <p>Service publié aujourd’hui</p>
            </div>
          </div>
        </section>

        <section className="values" id="pourquoi">
          <div className="section-heading">
            <p className="section-eyebrow">Pourquoi Connected Neighbours</p>
            <h2>Une entraide simple, locale et rassurante</h2>
          </div>

          <div className="values-grid">
            {values.map((value) => (
              <article className="value-card" key={value.title}>
                <span className="value-emoji">{value.emoji}</span>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="categories" id="categories">
          <div className="section-heading">
            <p className="section-eyebrow">Nos services</p>
            <h2>Un service pour chaque besoin du quotidien</h2>
            <p className="section-subtitle">
              Parcourez les catégories les plus demandées par les habitants de
              votre quartier.
            </p>
          </div>

          <div className="categories-grid">
            {categories.map((category) => (
              <article className="category-card" key={category.title}>
                <span className="category-emoji">{category.emoji}</span>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="how-it-works" id="comment-ca-marche">
          <div className="section-heading">
            <p className="section-eyebrow">Comment ça marche</p>
            <h2>Trois étapes pour rendre service à vos voisins</h2>
          </div>

          <ol className="steps-grid">
            {steps.map((step) => (
              <li className="step-card" key={step.number}>
                <span className="step-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="cta-banner">
          <div>
            <h2>Prêt à donner un coup de main à votre quartier ?</h2>
            <p>
              Rejoignez votre communauté de voisins et publiez votre premier
              service en quelques minutes.
            </p>
          </div>
          <Link className="button-primary" to="/app">
            Rejoindre mon quartier
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-brand">
          <span className="landing-brand-mark">CN</span>
          <span>Connected Neighbours</span>
        </div>
        <p>Des voisins qui s’entraident, un quartier à la fois.</p>
        <p className="landing-footer-copy">
          © {new Date().getFullYear()} Connected Neighbours
        </p>
      </footer>
    </div>
  );
}
