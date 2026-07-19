import { Route, Routes } from 'react-router-dom';

import DashboardApp from './dashboard/DashboardApp';
import LandingPage from './landing/LandingPage';

export default function App() {
  return (
    <Routes>
      <Route element={<LandingPage />} path="/" />
      <Route element={<DashboardApp />} path="/app" />
    </Routes>
  );
}
