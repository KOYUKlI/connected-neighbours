import { createBrowserRouter, Navigate } from 'react-router-dom';

import App from './App';
import { CreateAlertPage } from './features/alerts/CreateAlertPage';
import { IncidentAlertsPage } from './features/alerts/IncidentAlertsPage';
import { ContractsPage } from './features/contracts/ContractsPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { IncidentsPage } from './features/incidents/IncidentsPage';
import { ServicesPage } from './features/services/ServicesPage';
import { SyncPage } from './features/sync/SyncPage';
import { UsersPage } from './features/users/UsersPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate replace to="/dashboard" /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'services', element: <ServicesPage /> },
      { path: 'contracts', element: <ContractsPage /> },
      { path: 'incidents', element: <IncidentsPage /> },
      { path: 'incidents/:incidentId/alerts', element: <IncidentAlertsPage /> },
      { path: 'incidents/:incidentId/alerts/new', element: <CreateAlertPage /> },
      { path: 'sync', element: <SyncPage /> },
      { path: 'users', element: <UsersPage /> },
    ],
  },
]);
