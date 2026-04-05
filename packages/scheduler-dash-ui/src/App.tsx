import { Routes, Route } from 'react-router-dom';
import DashboardPage from '@/pages/DashboardPage';
import JobDetailPage from '@/pages/JobDetailPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/jobs/:name" element={<JobDetailPage />} />
    </Routes>
  );
}
