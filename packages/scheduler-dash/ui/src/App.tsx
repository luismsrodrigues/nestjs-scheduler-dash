import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/theme';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';

declare global {
  interface Window { __SCHEDULER_BASE__: string; }
}

export default function App() {
  const base = window.__SCHEDULER_BASE__ ?? '/_jobs';

  return (
    <ThemeProvider>
      <BrowserRouter basename={base}>
        <Routes>
          <Route path="/" element={<JobsPage />} />
          <Route path="/jobs/:name" element={<JobDetailPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
