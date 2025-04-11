import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import LeftSidebar from './components/LeftSidebar';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import GraphPage from './pages/GraphPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import { FaBars, FaTimes } from 'react-icons/fa';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);

  // Check for mobile view on resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 992;
      setIsMobile(mobile);
      
      // Close mobile menu automatically if screen becomes larger
      if (!mobile && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  const handleNavigation = (path: string) => {
    navigate(path);
    setCurrentPath(path);
    
    // Close mobile menu after navigation
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="app-container">
      {isMobile && (
        <button 
          className="mobile-menu-toggle" 
          onClick={toggleMobileMenu}
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      )}

      <LeftSidebar 
        currentPath={currentPath} 
        onNavigate={handleNavigation}
        className={isMobileMenuOpen ? 'active' : ''}
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