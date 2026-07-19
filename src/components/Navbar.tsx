import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import { Wallet, LogOut, Package2, AlertCircle, Sun, Moon } from 'lucide-react';

const Navbar: React.FC = () => {
  const { address, isConnecting, balance, error, connect, disconnect, clearError } = useWallet();
  const { theme, toggleTheme } = useTheme();

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

      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surfaceBorder/40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center space-x-2 text-primary font-extrabold text-lg sm:text-xl tracking-wide shrink-0">
              <Package2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              <span>
                <span className="text-textMain">Stellar</span>
                <span className="text-primary">Syndicate</span>
              </span>
            </Link>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {address && (
                <Link to="/dashboard" className="text-textMuted hover:text-textMain transition-colors text-xs sm:text-sm font-bold mr-1 sm:mr-2">
                  Dashboard
                </Link>
              )}

              {/* Floating Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 sm:p-2.5 rounded-xl bg-surfaceHover/80 hover:bg-surfaceBorder border border-surfaceBorder/40 text-textMuted hover:text-textMain transition-all cursor-pointer mr-1 active:scale-95"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-accent" />
                ) : (
                  <Moon className="w-4 h-4 text-primary" />
                )}
              </button>

              {!address ? (
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className="flex items-center space-x-1.5 sm:space-x-2 bg-zinc-900 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md"
                >
                  <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
                </button>
              ) : (
                <div className="flex items-center space-x-1.5 sm:space-x-3">
                  {/* XLM Balance Display */}
                  <div className="bg-surfaceHover border border-surfaceBorder/40 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm flex items-center space-x-0.5">
                    <span className="text-textMuted text-[10px] sm:text-xs font-bold uppercase tracking-wider mr-0.5 hidden sm:inline">Balance:</span>
                    <span className="text-primary font-mono font-bold">
                      {balance !== null ? balance : '...'}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-textMuted ml-1">XLM</span>
                  </div>

                  {/* Connected Wallet Info */}
                  <div className="flex items-center space-x-1.5 sm:space-x-3 bg-surfaceHover px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-surfaceBorder/40 text-xs sm:text-sm">
                    <span className="font-bold text-textMain font-mono">
                      {formatAddress(address)}
                    </span>
                    <button
                      onClick={disconnect}
                      className="text-textMuted hover:text-danger transition-colors cursor-pointer"
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
