import { createBrowserRouter, Navigate } from 'react-router-dom';

import App from './App';
import { ContractsPage } from './features/contracts/ContractsPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { IncidentsPage } from './features/incidents/IncidentsPage';
import { InstallPage } from './features/install/InstallPage';
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
      { path: 'sync', element: <SyncPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'install', element: <InstallPage /> },
    ],
  },
]);
