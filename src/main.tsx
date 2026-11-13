import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { requestPersistentStorage } from './products/persist';
import { onAppResume } from './resume';
import { App } from './ui/App';

// On resume, ask for new app code too; autoUpdate then reloads the page with it.
if (import.meta.env.PROD) {
  registerSW({ immediate: true, onRegisteredSW: (_url, reg) => reg && onAppResume(() => void reg.update()) });
}
void requestPersistentStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
