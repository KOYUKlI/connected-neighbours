import { createBrowserRouter, Navigate } from 'react-router-dom';

import App from './App';
import { ApplicationsPage } from './features/applications/ApplicationsPage';
import { CreateAlertPage } from './features/alerts/CreateAlertPage';
import { IncidentAlertsPage } from './features/alerts/IncidentAlertsPage';
import { ContractsPage } from './features/contracts/ContractsPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { LocalLifePage } from './features/local/LocalLifePage';
import { PointsPage } from './features/points/PointsPage';
import { RgpdPage } from './features/rgpd/RgpdPage';
import { ServicesPage } from './features/services/ServicesPage';
import { DesktopLoginPage } from './features/sso/DesktopLoginPage';
import LandingPage from './landing/LandingPage';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { HomePage } from './pages/HomePage';
import { DisputeDetailPage } from './pages/DisputeDetailPage';
import { ContractDocumentPage } from './features/documents/ContractDocumentPage';
import { DocumentDetailPage } from './features/documents/DocumentDetailPage';
import { DocumentsPage } from './features/documents/DocumentsPage';
import { DisputesPage } from './pages/DisputesPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ServiceCreatePage } from './pages/ServiceCreatePage';
import { ServiceDetailPage } from './pages/ServiceDetailPage';
import { ServicesExplorePage } from './pages/ServicesExplorePage';

const residentRoutes = [
  { index: true, element: <HomePage /> },
  { path: 'services', element: <ServicesExplorePage /> },
  { path: 'services/new', element: <ServiceCreatePage /> },
  { path: 'services/:serviceId', element: <ServiceDetailPage /> },
  { path: 'documents', element: <DocumentsPage /> },
  { path: 'documents/:documentId', element: <DocumentDetailPage /> },
  { path: 'contracts/:contractId/document', element: <ContractDocumentPage /> },
  { path: 'disputes', element: <DisputesPage /> },
  { path: 'disputes/:disputeId', element: <DisputeDetailPage /> },
  {
    path: 'neighbors',
    element: (
      <ComingSoonPage
        description="Découvrez bientôt les profils publics des habitants de votre quartier."
        icon="users"
        title="Voisins"
      />
    ),
  },
  {
    path: 'activities',
    element: (
      <ComingSoonPage
        description="Vos candidatures, contrats et actions personnelles seront regroupés ici."
        icon="activity"
        title="Mes activités"
      />
    ),
  },
  {
    path: 'local',
    element: (
      <ComingSoonPage
        description="Événements, votes et incidents seront réunis dans cet espace."
        icon="map-pin"
        title="Vie locale"
      />
    ),
  },
  {
    path: 'messages',
    element: (
      <ComingSoonPage
        description="La messagerie persistante sera intégrée dans un lot dédié."
        icon="message"
        title="Messages"
      />
    ),
  },
  {
    path: 'profile',
    element: (
      <ComingSoonPage
        description="La gestion détaillée du compte, des points et de la confidentialité arrive prochainement."
        icon="user"
        title="Mon profil"
      />
    ),
  },
];

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/welcome', element: <LandingPage /> },
  {
    path: '/',
    element: <App />,
    children: [...residentRoutes, { path: '*', element: <NotFoundPage /> }],
  },
  {
    path: '/app',
    element: <App />,
    children: [
      { index: true, element: <Navigate replace to="/" /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'services', element: <ServicesPage /> },
      { path: 'applications', element: <ApplicationsPage /> },
      { path: 'contracts', element: <ContractsPage /> },
      { path: 'points', element: <PointsPage /> },
      { path: 'local', element: <LocalLifePage /> },
      { path: 'incidents', element: <Navigate replace to="/app/local?tab=incidents" /> },
      { path: 'incidents/:incidentId/alerts', element: <IncidentAlertsPage /> },
      { path: 'incidents/:incidentId/alerts/new', element: <CreateAlertPage /> },
      { path: 'rgpd', element: <RgpdPage /> },
      { path: 'desktop-login', element: <DesktopLoginPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
