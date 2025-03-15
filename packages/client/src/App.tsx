// packages/client/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { StorageProvider } from './context/StorageContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import GraphPage from './pages/GraphPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import StorageModeSwitcher from './components/StorageModeSwitcher';
import VaultSetup from './components/VaultSetup';
import './App.css';

const App: React.FC = () => {
  // Check if we're in Tauri environment
  const isTauri = typeof window !== 'undefined' && 'Tauri' in window;
  
  return (
    <StorageProvider>
      <Router>
        <div className="app">
          <Navbar />
          {isTauri && <StorageModeSwitcher />}
          <div className="container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/graph" element={<GraphPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              {isTauri && <Route path="/vault" element={<VaultSetup />} />}
            </Routes>
          </div>
        </div>
      </Router>
    </StorageProvider>
  );
};

export default App;