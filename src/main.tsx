/*! BRACU CGPA Analyzer. Copyright 2026 Faiaz Abrar Zaman Pronoy. All rights reserved. See LICENSE. */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { StoreProvider } from './store';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </React.StrictMode>
);
