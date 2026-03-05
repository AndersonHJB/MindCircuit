import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Export App for library mode
export { App };

// Mount automatically if root element exists (for app mode)
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}