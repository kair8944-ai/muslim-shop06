import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (typeof window !== 'undefined') {
  (window as unknown as { __APP_MOUNTED__: boolean }).__APP_MOUNTED__ = true;
}
