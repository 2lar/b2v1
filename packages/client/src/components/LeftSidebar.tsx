import React from 'react';
import { 
  FaHome, 
  FaNetworkWired, 
  FaRobot, 
  FaCog,
  FaFolder
} from 'react-icons/fa';
import './LeftSidebar.css';

interface LeftSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  className?: string;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ currentPath, onNavigate, className = '' }) => {
  const isActive = (path: string): boolean => {
    return currentPath === path;
  };
  
  return (
    <div className={`left-sidebar ${className}`}>
      <div className="sidebar-logo">
        <h2>Second Brain</h2>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          <li>
            <button 
              onClick={() => onNavigate('/')} 
              className={`sidebar-link ${isActive('/') ? 'active' : ''}`}
            >
              <FaHome className="sidebar-icon" />
              <span>Home</span>
            </button>
          </li>
          <li>
            <button 
              onClick={() => onNavigate('/graph')} 
              className={`sidebar-link ${isActive('/graph') ? 'active' : ''}`}
            >
              <FaNetworkWired className="sidebar-icon" />
              <span>Knowledge Graph</span>
            </button>
          </li>
          <li>
            <button 
              onClick={() => onNavigate('/chat')} 
              className={`sidebar-link ${isActive('/chat') ? 'active' : ''}`}
            >
              <FaRobot className="sidebar-icon" />
              <span>Chat</span>
            </button>
          </li>
          <li>
            <button 
              onClick={() => onNavigate('/categories')} 
              className={`sidebar-link ${isActive('/categories') ? 'active' : ''}`}
            >
              <FaFolder className="sidebar-icon" />
              <span>Categories</span>
            </button>
          </li>
        </ul>
      </nav>
      
      <div className="sidebar-settings">
        <button 
          onClick={() => onNavigate('/settings')} 
          className={`sidebar-link ${isActive('/settings') ? 'active' : ''}`}
        >
          <FaCog className="sidebar-icon" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default LeftSidebar;