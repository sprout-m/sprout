import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';
import { WalletProvider } from './context/WalletContext';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WalletProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </WalletProvider>
  </React.StrictMode>
);
