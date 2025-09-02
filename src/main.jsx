import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './App'; // UPDATED: Import the new AppRouter
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {/* The <AuthProvider> is no longer needed here because 
        it is now handled inside the AppRouter component.
      */}
      <AppRouter />
    </ErrorBoundary>
  </React.StrictMode>
);