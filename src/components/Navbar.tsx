import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { Wallet, LogOut, Package2 } from 'lucide-react';

const Navbar: React.FC = () => {
  const { address, isConnecting, connect, disconnect } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 5)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surfaceHover">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2 text-primary font-bold text-xl tracking-wide">
            <Package2 className="w-6 h-6" />
            <span>StellarSyndicate</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            {address && (
              <Link to="/dashboard" className="text-textMuted hover:text-textMain transition-colors">
                Dashboard
              </Link>
            )}
            
            {!address ? (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="flex items-center space-x-2 bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Wallet className="w-4 h-4" />
                <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            ) : (
              <div className="flex items-center space-x-3 bg-surfaceHover px-4 py-2 rounded-lg">
                <span className="text-sm font-medium text-textMain">
                  {formatAddress(address)}
                </span>
                <button
                  onClick={disconnect}
                  className="text-textMuted hover:text-red-400 transition-colors"
                  title="Disconnect"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
