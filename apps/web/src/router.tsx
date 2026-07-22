import { createBrowserRouter, Navigate } from "react-router-dom";

import App from "./App";
import { ApplicationsPage } from "./features/applications/ApplicationsPage";
import { CreateAlertPage } from "./features/alerts/CreateAlertPage";
import { IncidentAlertsPage } from "./features/alerts/IncidentAlertsPage";
import { ContractsPage } from "./features/contracts/ContractsPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { LocalLifePage as IncidentLocalLifePage } from "./features/local/LocalLifePage";
import { PointsPage } from "./features/points/PointsPage";
import { RgpdPage } from "./features/rgpd/RgpdPage";
import { ServicesPage } from "./features/services/ServicesPage";
import { DesktopLoginPage } from "./features/sso/DesktopLoginPage";
import LandingPage from "./landing/LandingPage";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import { HomePage } from "./pages/HomePage";
import { DisputeDetailPage } from "./pages/DisputeDetailPage";
import { DiscoverPage } from "./pages/DiscoverPage";
import { ContractDocumentPage } from "./features/documents/ContractDocumentPage";
import { DocumentDetailPage } from "./features/documents/DocumentDetailPage";
import { DocumentsPage } from "./features/documents/DocumentsPage";
import { DisputesPage } from "./pages/DisputesPage";
import { LoginPage } from "./pages/LoginPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { SecurityPage } from "./pages/SecurityPage";
import { NeighborhoodPage } from "./pages/NeighborhoodPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProfilePage } from "./pages/ProfilePage";
import { PublicProfilePage } from "./pages/PublicProfilePage";
import { ServiceCreatePage } from "./pages/ServiceCreatePage";
import { ServiceDetailPage } from "./pages/ServiceDetailPage";
import { ServicesExplorePage } from "./pages/ServicesExplorePage";
import { EventDetailPage } from "./features/local-life/EventDetailPage";
import { EventDiscoverPage } from "./features/local-life/EventDiscoverPage";
import { EventFormPage } from "./features/local-life/EventFormPage";
import { EventsPage } from "./features/local-life/EventsPage";
import { LocalLifePage } from "./features/local-life/LocalLifePage";
import { VoteDetailPage } from "./features/local-life/VoteDetailPage";
import { VotesPage } from "./features/local-life/VotesPage";

const residentRoutes = [
  { index: true, element: <HomePage /> },
  { path: "services", element: <ServicesExplorePage /> },
  { path: "services/new", element: <ServiceCreatePage /> },
  { path: "services/:serviceId", element: <ServiceDetailPage /> },
  { path: "documents", element: <DocumentsPage /> },
  { path: "documents/:documentId", element: <DocumentDetailPage /> },
  { path: "contracts/:contractId/document", element: <ContractDocumentPage /> },
  { path: "disputes", element: <DisputesPage /> },
  { path: "disputes/:disputeId", element: <DisputeDetailPage /> },
  { path: "local-life", element: <LocalLifePage /> },
  { path: "local", element: <Navigate replace to="/local-life" /> },
  { path: "events", element: <EventsPage /> },
  { path: "events/discover", element: <EventDiscoverPage /> },
  { path: "events/new", element: <EventFormPage /> },
  { path: "events/:eventId/edit", element: <EventFormPage /> },
  { path: "events/:eventId", element: <EventDetailPage /> },
  { path: "votes", element: <VotesPage /> },
  { path: "votes/:voteId", element: <VoteDetailPage /> },
  { path: "discover", element: <DiscoverPage /> },
  { path: "neighbors", element: <DiscoverPage /> },
  { path: "neighbors/:userId", element: <PublicProfilePage /> },
  {
    path: "activities",
    element: (
      <ComingSoonPage
        description="Vos candidatures, contrats et actions personnelles seront regroupés ici."
        icon="activity"
        title="Mes activités"
      />
    ),
  },
  {
    path: "messages",
    element: (
      <ComingSoonPage
        description="La messagerie persistante sera intégrée dans un lot dédié."
        icon="message"
        title="Messages"
      />
    ),
  },
  { path: "profile", element: <ProfilePage /> },
  { path: "security", element: <SecurityPage /> },
  { path: "neighborhood", element: <NeighborhoodPage /> },
];

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/auth/callback", element: <AuthCallbackPage /> },
  { path: "/welcome", element: <LandingPage /> },
  {
    path: "/",
    element: <App />,
    children: [...residentRoutes, { path: "*", element: <NotFoundPage /> }],
  },
  {
    path: "/app",
    element: <App />,
    children: [
      { index: true, element: <Navigate replace to="/" /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "services", element: <ServicesPage /> },
      { path: "applications", element: <ApplicationsPage /> },
      { path: "contracts", element: <ContractsPage /> },
      { path: "points", element: <PointsPage /> },
      { path: "local", element: <IncidentLocalLifePage /> },
      {
        path: "incidents",
        element: <Navigate replace to="/app/local?tab=incidents" />,
      },
      { path: "incidents/:incidentId/alerts", element: <IncidentAlertsPage /> },
      {
        path: "incidents/:incidentId/alerts/new",
        element: <CreateAlertPage />,
      },
      { path: "rgpd", element: <RgpdPage /> },
      { path: "desktop-login", element: <DesktopLoginPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
