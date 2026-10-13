import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import { App } from './app/App';
import { readStorage, STORAGE_KEYS } from './lib/storage';

// Aplica o tema guardado antes do primeiro desenho (sem flash).
const theme = readStorage(STORAGE_KEYS.theme, ['system', 'light', 'dark'] as const, 'system');
if (theme !== 'system') document.documentElement.setAttribute('data-theme', theme);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
