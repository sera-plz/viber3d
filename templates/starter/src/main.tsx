// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { App } from './app';

// Create root & render
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
