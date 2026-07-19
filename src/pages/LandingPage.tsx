import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { motion } from 'framer-motion';
import { Users, Truck, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

const LandingPage: React.FC = () => {
  const { address, isConnecting, connect } = useWallet();

  const features = [
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: 'Form Syndicates',
      description: 'Pool funds with local businesses or community members to hit wholesale minimums.'
    },
    {
      icon: <Truck className="w-8 h-8 text-primary" />,
      title: 'Split Logistics',
      description: 'Automatically calculate proportional shipping and customs costs for each member.'
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-primary" />,
      title: 'Fast Settlement',
      description: 'Settle debts instantly via Stellar USDC/XLM with near-zero transaction fees.'
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-16 py-12 px-4 relative overflow-hidden transition-colors duration-200">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6 max-w-4xl relative z-10"
      >
        {/* Singular highly intentional amber accent tag */}
        <span className="inline-flex items-center space-x-1.5 bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
          <span>Soroban Smart Contract Powered</span>
        </span>

        {/* Hero title with vertical padding to prevent bg-clip-text descender clipping */}
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] md:leading-[1.15] py-3">
          Decentralized{' '}
          <span className="bg-gradient-to-r from-primary to-teal-400 bg-clip-text text-transparent pb-1">
            Co-op Purchasing
          </span>
        </h1>
        <p className="text-base md:text-lg text-textMuted max-w-2xl mx-auto leading-relaxed font-medium">
          Unlock wholesale prices. Pool resources, track shared expenses, and settle instantly on the Stellar network.
        </p>
        
        <div className="pt-8">
          {address ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 bg-zinc-900 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-8 py-4 rounded-2xl text-lg font-bold shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="inline-flex items-center space-x-2 bg-zinc-900 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-8 py-4 rounded-2xl text-lg font-bold shadow-md hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 cursor-pointer"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Connect Wallet to Start</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>

      {/* Mobile responsive grid columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full relative z-10">
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 + idx * 0.1 }}
            className="glass-panel border-surfaceBorder/40 p-8 rounded-3xl hover:scale-[1.02] transition-all duration-300 relative group overflow-hidden shadow-sm"
          >
            <div className="bg-surface border border-surfaceBorder/40 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 mx-auto shadow-sm">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold mb-3 text-textMain">{feature.title}</h3>
            <p className="text-textMuted text-sm leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LandingPage;
