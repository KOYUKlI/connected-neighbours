import { createBrowserRouter, Navigate } from 'react-router-dom';

import App from './App';
import { ApplicationsPage } from './features/applications/ApplicationsPage';
import { CreateAlertPage } from './features/alerts/CreateAlertPage';
import { IncidentAlertsPage } from './features/alerts/IncidentAlertsPage';
import { ContractsPage } from './features/contracts/ContractsPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { IncidentsPage } from './features/incidents/IncidentsPage';
import { PointsPage } from './features/points/PointsPage';
import { RgpdPage } from './features/rgpd/RgpdPage';
import { ServicesPage } from './features/services/ServicesPage';
import { DesktopLoginPage } from './features/sso/DesktopLoginPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate replace to="/dashboard" /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'services', element: <ServicesPage /> },
      { path: 'applications', element: <ApplicationsPage /> },
      { path: 'contracts', element: <ContractsPage /> },
      { path: 'points', element: <PointsPage /> },
      { path: 'incidents', element: <IncidentsPage /> },
      { path: 'incidents/:incidentId/alerts', element: <IncidentAlertsPage /> },
      { path: 'incidents/:incidentId/alerts/new', element: <CreateAlertPage /> },
      { path: 'rgpd', element: <RgpdPage /> },
      { path: 'desktop-login', element: <DesktopLoginPage /> },
    ],
  },
]);
