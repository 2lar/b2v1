// packages/client/src/components/StorageModeSwitcher.tsx
import React from 'react';
import { useStorage } from '../context/StorageContext';
import { FaCloud, FaLaptop } from 'react-icons/fa';
import './StorageModeSwitcher.css';

const StorageModeSwitcher: React.FC = () => {
  const { storageMode, switchStorageMode, isVaultSelected } = useStorage();
  
  const handleSwitchToLocal = async () => {
    await switchStorageMode('local');
  };
  
  const handleSwitchToCloud = async () => {
    await switchStorageMode('cloud');
  };
  
  return (
    <div className="storage-mode-switcher">
      <button 
        className={`mode-button ${storageMode === 'cloud' ? 'active' : ''}`}
        onClick={handleSwitchToCloud}
      >
        <FaCloud /> Cloud Storage
      </button>
      
      <button 
        className={`mode-button ${storageMode === 'local' ? 'active' : ''}`}
        onClick={handleSwitchToLocal}
        disabled={storageMode === 'local' && !isVaultSelected}
      >
        <FaLaptop /> Local Storage
        {storageMode === 'local' && !isVaultSelected && ' (Setup Required)'}
      </button>
    </div>
  );
};

export default StorageModeSwitcher;