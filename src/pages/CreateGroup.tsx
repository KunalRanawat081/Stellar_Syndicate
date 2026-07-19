import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useGroups } from '../hooks/useGroups';
import { motion } from 'framer-motion';
import { createGroupOnChain } from '../utils/soroban';
import LoadingOverlay from '../components/LoadingOverlay';
import { PlusCircle, FileText, Target, Users2, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const CreateGroup: React.FC = () => {
  const { address } = useWallet();
  const { addGroup } = useGroups();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState(0);

  // Transaction States
  const [txStatus, setTxStatus] = useState<'pending' | 'success' | 'failed' | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    const groupId = Math.random().toString(36).substring(7);

    // Initialize transaction states
    setIsOverlayOpen(true);
    setTxStatus('pending');
    setTxHash(null);
    setTxError(null);

    try {
      // Call Soroban contract method to create the group on-chain
      const hash = await createGroupOnChain(groupId, title, description, address);

      setTxHash(hash);
      setTxStatus('success');

      // Update local storage representation
      const newGroup = {
        id: groupId,
        title,
        description,
        leadBuyer: address,
        totalGoodsTarget: target,
        status: 'Open' as const,
        members: [],
        expenses: [],
        createdAt: Date.now(),
      };
      addGroup(newGroup);
    } catch (err: any) {
      console.error(err);
      setTxStatus('failed');
      setTxError(err.message || 'Unknown error occurred during contract call.');
    }
  };

  const handleOverlayClose = () => {
    setIsOverlayOpen(false);
    if (txStatus === 'success') {
      navigate('/dashboard');
    }
  };

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Users2 className="w-16 h-16 text-textMuted mb-4" />
        <h2 className="text-2xl font-bold mb-2">Wallet Disconnected</h2>
        <p className="text-textMuted max-w-md">Please connect your wallet first to create a purchase syndicate.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 text-textMuted hover:text-textMain transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gradient">Create a Syndicate</h1>
        <p className="text-textMuted">Start a new bulk purchasing group registered directly on the Stellar blockchain.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass-panel border-surfaceBorder/40 p-8 rounded-3xl space-y-6 shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-semibold text-textMain">
            <PlusCircle className="w-4 h-4 text-primary" />
            <span>Group Title</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-background border border-surfaceBorder/50 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all text-textMain text-sm placeholder:text-textMuted/60"
            placeholder="e.g. Summer Coffee Bean Import"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-semibold text-textMain">
            <FileText className="w-4 h-4 text-primary" />
            <span>Description</span>
          </label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-background border border-surfaceBorder/50 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all min-h-[140px] text-textMain text-sm placeholder:text-textMuted/60 leading-relaxed"
            placeholder="What products are we bulk-buying? What are the pricing tiers or shipping logistics details?"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-semibold text-textMain">
            <Target className="w-4 h-4 text-primary" />
            <span>Total Units Target (Optional)</span>
          </label>
          <input
            type="number"
            min="0"
            value={target}
            onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
            className="w-full bg-background border border-surfaceBorder/50 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all text-textMain text-sm placeholder:text-textMuted/60"
            placeholder="0"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary hover:bg-primaryHover text-white font-bold py-4 rounded-2xl transition-all cursor-pointer shadow-lg hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.99]"
        >
          Initialize On-Chain Group
        </button>
      </form>

      <LoadingOverlay
        isOpen={isOverlayOpen}
        status={txStatus}
        txHash={txHash}
        errorMessage={txError}
        onClose={handleOverlayClose}
        title="Creating Syndicate Group"
      />
    </motion.div>
  );
};

export default CreateGroup;
