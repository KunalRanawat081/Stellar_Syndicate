import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useGroups } from '../hooks/useGroups';
import { motion } from 'framer-motion';

const CreateGroup: React.FC = () => {
  const { address } = useWallet();
  const { addGroup } = useGroups();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    const newGroup = {
      id: Math.random().toString(36).substring(7),
      title,
      description,
      leadBuyer: address,
      totalGoodsTarget: target,
      status: 'Open' as const,
      members: [],
      expenses: [],
      createdAt: Date.now()
    };

    addGroup(newGroup);
    navigate(`/group/${newGroup.id}`);
  };

  if (!address) {
    return <div className="text-center py-20">Please connect your wallet first.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold">Create a Syndicate</h1>
        <p className="text-textMuted mt-2">Start a new bulk purchasing group.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface p-8 rounded-2xl border border-surfaceHover space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Group Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-background border border-surfaceHover rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors"
            placeholder="e.g. Summer 2026 Coffee Bean Import"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            required
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-background border border-surfaceHover rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors min-h-[120px]"
            placeholder="What are we buying? Where is it coming from?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Total Units Target (Optional)</label>
          <input
            type="number"
            min="0"
            value={target}
            onChange={e => setTarget(parseInt(e.target.value) || 0)}
            className="w-full bg-background border border-surfaceHover rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors"
            placeholder="0"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary hover:bg-primaryHover text-white font-bold py-3 rounded-lg transition-colors"
        >
          Create Group
        </button>
      </form>
    </motion.div>
  );
};

export default CreateGroup;
