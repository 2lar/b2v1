import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaNetworkWired, FaRobot } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>Second Brain</h1>
      </div>
      
      <ul className="navbar-nav">
        <li className="nav-item">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            <FaHome className="nav-icon" />
            <span>Home</span>
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/graph" className={`nav-link ${location.pathname === '/graph' ? 'active' : ''}`}>
            <FaNetworkWired className="nav-icon" />
            <span>Knowledge Graph</span>
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/chat" className={`nav-link ${location.pathname === '/chat' ? 'active' : ''}`}>
            <FaRobot className="nav-icon" />
            <span>Chat</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;