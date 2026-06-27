import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { Wallet, LogOut, Package2, AlertCircle } from 'lucide-react';

const Navbar: React.FC = () => {
  const { address, isConnecting, balance, error, connect, disconnect, clearError } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 5)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="w-full">
      {/* Wallet Connection Error Banner */}
      {error && (
        <div className="bg-red-500/20 text-red-200 border-b border-red-500/30 px-4 py-2 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-xs underline hover:text-white transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      <nav className="sticky top-0 z-50 bg-surface/85 backdrop-blur-md border-b border-surfaceHover">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center space-x-2 text-primary font-bold text-xl tracking-wide">
              <Package2 className="w-6 h-6" />
              <span>StellarSyndicate</span>
            </Link>

            <div className="flex items-center space-x-4">
              {address && (
                <Link to="/dashboard" className="text-textMuted hover:text-textMain transition-colors text-sm font-medium mr-2">
                  Dashboard
                </Link>
              )}

              {!address ? (
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className="flex items-center space-x-2 bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Wallet className="w-4 h-4" />
                  <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
                </button>
              ) : (
                <div className="flex items-center space-x-3">
                  {/* XLM Balance Display */}
                  <div className="bg-surface/50 border border-surfaceHover px-3 py-1.5 rounded-lg text-sm flex items-center space-x-1">
                    <span className="text-textMuted text-xs font-semibold uppercase tracking-wider mr-1">XLM:</span>
                    <span className="text-textMain font-mono font-bold text-primary">
                      {balance !== null ? balance : 'Loading...'}
                    </span>
                  </div>

                  {/* Connected Wallet Info */}
                  <div className="flex items-center space-x-3 bg-surfaceHover px-4 py-1.5 rounded-lg border border-surfaceHover">
                    <span className="text-sm font-medium text-textMain">
                      {formatAddress(address)}
                    </span>
                    <button
                      onClick={disconnect}
                      className="text-textMuted hover:text-red-400 transition-colors cursor-pointer"
                      title="Disconnect"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
