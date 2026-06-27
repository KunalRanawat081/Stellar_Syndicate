import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { motion } from 'framer-motion';
import { Users, Truck, ShieldCheck, ArrowRight } from 'lucide-react';

const LandingPage: React.FC = () => {
  const { address, connect } = useWallet();

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
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6 max-w-3xl"
      >
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Decentralized <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Co-op Purchasing</span>
        </h1>
        <p className="text-xl text-textMuted max-w-2xl mx-auto leading-relaxed">
          Unlock wholesale prices. Pool resources, track shared expenses, and settle instantly on the Stellar network.
        </p>
        
        <div className="pt-8">
          {address ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 bg-primary hover:bg-primaryHover text-white px-8 py-4 rounded-xl text-lg font-bold transition-all transform hover:scale-105"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <button
              onClick={connect}
              className="inline-flex items-center space-x-2 bg-primary hover:bg-primaryHover text-white px-8 py-4 rounded-xl text-lg font-bold transition-all transform hover:scale-105"
            >
              <span>Connect Wallet to Start</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl w-full">
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 + idx * 0.1 }}
            className="bg-surface p-8 rounded-2xl border border-surfaceHover hover:border-primary/50 transition-colors"
          >
            <div className="bg-background rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
            <p className="text-textMuted leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LandingPage;
