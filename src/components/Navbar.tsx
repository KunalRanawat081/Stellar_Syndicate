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
            <Link to="/" className="flex items-center space-x-2 text-primary font-bold text-lg sm:text-xl tracking-wide shrink-0">
              <Package2 className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>
                <span className="hidden sm:inline">Stellar</span>Syndicate
              </span>
            </Link>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {address && (
                <Link to="/dashboard" className="text-textMuted hover:text-textMain transition-colors text-xs sm:text-sm font-medium mr-1 sm:mr-2">
                  Dashboard
                </Link>
              )}

              {!address ? (
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className="flex items-center space-x-1.5 sm:space-x-2 bg-primary hover:bg-primaryHover text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
                </button>
              ) : (
                <div className="flex items-center space-x-1.5 sm:space-x-3">
                  {/* XLM Balance Display */}
                  <div className="bg-surface/50 border border-surfaceHover px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm flex items-center space-x-0.5">
                    <span className="text-textMuted text-[10px] sm:text-xs font-semibold uppercase tracking-wider mr-0.5 hidden sm:inline">XLM:</span>
                    <span className="text-textMain font-mono font-bold text-primary">
                      {balance !== null ? balance : '...'}
                    </span>
                    <span className="text-[10px] font-bold text-primary sm:hidden">X</span>
                  </div>

                  {/* Connected Wallet Info */}
                  <div className="flex items-center space-x-1.5 sm:space-x-3 bg-surfaceHover px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-lg border border-surfaceHover text-xs sm:text-sm">
                    <span className="font-medium text-textMain font-mono">
                      {formatAddress(address)}
                    </span>
                    <button
                      onClick={disconnect}
                      className="text-textMuted hover:text-red-400 transition-colors cursor-pointer"
                      title="Disconnect"
                    >
                      <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
