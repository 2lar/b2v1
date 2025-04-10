import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
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
      <Link to="/settings" className={`nav-link ${isActive('/settings') ? 'active' : ''}`}>
        <FaCog className="nav-icon" />
        <span>Settings for now but should be profile</span>
      </Link>
    </nav>
  );
};

export default Navbar;