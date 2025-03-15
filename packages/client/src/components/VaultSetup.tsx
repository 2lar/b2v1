// packages/client/src/components/VaultSetup.tsx
import React from 'react';
import { useStorage } from '../context/StorageContext';
import { FaFolder, FaFolderOpen, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import './VaultSetup.css';

const VaultSetup: React.FC = () => {
  const { selectVault, isVaultSelected } = useStorage();
  
  const handleSelectVault = async () => {
    await selectVault();
  };
  
  return (
    <div className="vault-setup">
      <h1>Second Brain Vault Setup</h1>
      
      <div className="vault-card">
        <div className="vault-status">
          {isVaultSelected ? (
            <div className="status success">
              <FaCheck /> Vault Selected
            </div>
          ) : (
            <div className="status warning">
              <FaExclamationTriangle /> No Vault Selected
            </div>
          )}
        </div>
        
        <p className="vault-description">
          Your vault is where all your notes and connections are stored locally on your computer.
          {!isVaultSelected && ' Please select a folder to use as your vault.'}
        </p>
        
        <button className="vault-select-button" onClick={handleSelectVault}>
          {isVaultSelected ? (
            <>
              <FaFolderOpen /> Change Vault Location
            </>
          ) : (
            <>
              <FaFolder /> Select Vault Location
            </>
          )}
        </button>
        
        {isVaultSelected && (
          <div className="vault-info">
            <p>Your notes and data are being stored locally in your vault.</p>
            <p className="tip">Tip: You can back up this folder or sync it with services like Dropbox or Google Drive.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VaultSetup;