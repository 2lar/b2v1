import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaNetworkWired, 
  FaRobot, 
  FaCog 
} from 'react-icons/fa';
import './Navbar.css';

const Navbar: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };
  
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>Second Brain</h1>
      </div>
      
      <ul className="navbar-nav">
        <li className="nav-item">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            <FaHome className="nav-icon" />
            <span>Home</span>
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/graph" className={`nav-link ${isActive('/graph') ? 'active' : ''}`}>
            <FaNetworkWired className="nav-icon" />
            <span>Knowledge Graph</span>
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/chat" className={`nav-link ${isActive('/chat') ? 'active' : ''}`}>
            <FaRobot className="nav-icon" />
            <span>Chat</span>
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/settings" className={`nav-link ${isActive('/settings') ? 'active' : ''}`}>
            <FaCog className="nav-icon" />
            <span>Settings</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;