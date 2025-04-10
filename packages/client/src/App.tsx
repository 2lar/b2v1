import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import LeftSidebar from './components/LeftSidebar';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import GraphPage from './pages/GraphPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

const CategoriesPage: React.FC = () => {
  return (
    <div className="categories-page">
      <h1>Categories</h1>
      <p>Manage and explore your note categories</p>
    </div>
  );
};

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const handleNavigation = (path: string) => {
    navigate(path);
    setCurrentPath(path);
  };

  return (
    <div className="app-container">
      <LeftSidebar 
        currentPath={currentPath} 
        onNavigate={handleNavigation} 
      />
      <Navbar />
      <main className="main-content">
        <div className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/graph" element={<GraphPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;