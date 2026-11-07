import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* BASE_URL is "/" at the domain root and the sub-path when deployed in a sub-directory. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
