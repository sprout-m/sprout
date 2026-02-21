import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { MarketProvider } from './context/MarketContext';
import { WalletProvider } from './context/WalletContext';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WalletProvider>
      <MarketProvider>
        <App />
      </MarketProvider>
    </WalletProvider>
  </React.StrictMode>
);
