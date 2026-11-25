import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/archivo/wdth.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/home.css';
import './styles/research.css';
import './styles/habits.css';
import './styles/challenge.css';
import './styles/glass.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
