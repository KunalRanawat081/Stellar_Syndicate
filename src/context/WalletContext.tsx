import React, { createContext, useContext, useState, useEffect } from 'react';
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';
import * as StellarSdk from '@stellar/stellar-sdk';

// Initialize StellarWalletsKit once
StellarWalletsKit.init({
  modules: defaultModules(),
  network: Networks.TESTNET,
});

interface WalletContextType {
  address: string | null;
  isConnecting: boolean;
  balance: string | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  fetchBalance: () => Promise<void>;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const LOCAL_STORAGE_WALLET_KEY = 'stellarsyndicate_wallet_address';

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore wallet address from local storage on mount
  useEffect(() => {
    const savedAddress = localStorage.getItem(LOCAL_STORAGE_WALLET_KEY);
    if (savedAddress) {
      setAddress(savedAddress);
    }
  }, []);

  // Fetch balance whenever address changes
  useEffect(() => {
    if (address) {
      fetchBalance();
    } else {
      setBalance(null);
    }
  }, [address]);

  const fetchBalance = async () => {
    if (!address) return;
    try {
      const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
      const accountInfo = await server.loadAccount(address);
      const nativeBalance = accountInfo.balances.find((b) => b.asset_type === 'native');
      if (nativeBalance) {
        setBalance(Number(nativeBalance.balance).toFixed(4));
      } else {
        setBalance('0.0000');
      }
    } catch (e: any) {
      console.error('Failed to fetch XLM balance:', e);
      // If account is not found on Testnet, display 0 and explain it needs funding
      if (e.response && e.response.status === 404) {
        setBalance('0.0000 (Unfunded)');
      } else {
        setBalance('Error');
      }
    }
  };

  const connect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      // Open the StellarWalletsKit auth modal
      const { address: connectedAddress } = await StellarWalletsKit.authModal();

      if (connectedAddress) {
        setAddress(connectedAddress);
        localStorage.setItem(LOCAL_STORAGE_WALLET_KEY, connectedAddress);
      }
    } catch (e: any) {
      console.error('Failed to connect wallet:', e);
      // Map error messages to be user friendly
      const msg = e.message || String(e);
      if (msg.includes('rejected') || msg.includes('cancel')) {
        setError('Connection request rejected by user.');
      } else if (msg.includes('installed') || msg.includes('available')) {
        setError('Selected wallet is not installed or unavailable.');
      } else {
        setError('Failed to connect: ' + msg);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await StellarWalletsKit.disconnect();
    } catch (e) {
      console.error('Error during disconnect:', e);
    }
    setAddress(null);
    setBalance(null);
    setError(null);
    localStorage.removeItem(LOCAL_STORAGE_WALLET_KEY);
  };

  const clearError = () => setError(null);

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnecting,
        balance,
        error,
        connect,
        disconnect,
        fetchBalance,
        clearError,
      }}
    >
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
