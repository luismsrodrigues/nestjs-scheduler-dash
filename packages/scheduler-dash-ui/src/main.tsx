import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/theme';
import App from './App';
import './index.css';

const base = window.__SCHEDULER_BASE__ ?? '';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter basename={base}>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
