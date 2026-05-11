import 'antd/dist/reset.css';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClientProvider } from '@tanstack/react-query';

import App from './app';
import { createAppQueryClient } from './libs/react-query';

const queryClient = createAppQueryClient();

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <BrowserRouter>
          <Suspense
            fallback={
              <div style={{ textAlign: 'center', marginTop: '20%' }}>🚀 Chargement en cours...</div>
            }
          >
            <App />
          </Suspense>
        </BrowserRouter>
      </HelmetProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
