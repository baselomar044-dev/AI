import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/mobile.css';
import { initDynamicTheme } from './lib/dynamic-theme';

// Initialize dynamic theme system
initDynamicTheme();

// Suppress benign AbortError (React StrictMode double-fetch or fast navigation)
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.name === 'AbortError' || event.reason?.message?.includes('aborted')) {
    event.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

