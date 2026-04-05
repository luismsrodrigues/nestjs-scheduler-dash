import { BrowserRouter, Routes, Route } from 'react-router-dom';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';

export default function App() {
  return (
    <BrowserRouter basename="/_jobs">
      <Routes>
        <Route path="/" element={<JobsPage />} />
        <Route path="/jobs/:name" element={<JobDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
