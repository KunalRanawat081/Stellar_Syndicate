import React, { createContext, useContext, useState, useEffect } from 'react';
import { isAllowed, setAllowed, requestAccess } from '@stellar/freighter-api';

interface WalletContextType {
  address: string | null;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      if (await isAllowed()) {
        const response = await requestAccess();
        if (typeof response === 'string') {
          setAddress(response);
        } else if (response && 'address' in response && response.address) {
          setAddress(response.address);
        }
      }
    } catch (e) {
      console.error("Failed to check Freighter connection", e);
    }
  };

  const connect = async () => {
    setIsConnecting(true);
    try {
      await setAllowed();
      const response = await requestAccess();
      if (typeof response === 'string') {
        setAddress(response);
      } else if (response && 'address' in response && response.address) {
        setAddress(response.address);
      }
    } catch (e) {
      console.error("Failed to connect Freighter", e);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    // Note: Freighter API doesn't have a strict "disconnect" that revokes permission easily,
    // so we just clear the local state for now.
  };

  return (
    <WalletContext.Provider value={{ address, isConnecting, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
