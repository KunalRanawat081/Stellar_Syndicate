import React from 'react';
import { Link } from 'react-router-dom';
import { useGroups } from '../hooks/useGroups';
import { useWallet } from '../context/WalletContext';
import { motion } from 'framer-motion';
import { Plus, FolderOpen, ChevronRight, Users, Target } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { address } = useWallet();
  const { groups } = useGroups();

  // Filter groups that the user is part of (as lead buyer or member)
  const userGroups = groups.filter(g => 
    g.leadBuyer === address || g.members.some(m => m.address === address)
  );

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gradient">My Syndicates</h1>
          <p className="text-textMuted text-sm">Monitor and interact with your active bulk buying co-ops.</p>
        </div>
        <Link
          to="/create-group"
          className="flex items-center space-x-2 bg-primary hover:bg-primaryHover text-white px-5 py-3 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          <span>New Syndicate</span>
        </Link>
      </div>

      {userGroups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-textMuted glass-panel rounded-3xl border border-dashed border-surfaceBorder/60"
        >
          <div className="bg-surface/60 p-4 rounded-full border border-surfaceBorder mb-6">
            <FolderOpen className="w-10 h-10 text-textMuted/60" />
          </div>
          <h2 className="text-xl font-bold text-textMain mb-2">No Active Syndicates</h2>
          <p className="max-w-md text-center text-sm text-textMuted/80 px-4 leading-relaxed">
            You haven't joined or created any purchasing syndicates. Create a new purchase group to begin pooling wholesale order values.
          </p>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userGroups.map((group, idx) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="glass-panel border-surfaceBorder/40 rounded-3xl p-6 shadow-lg hover:shadow-primary/5 hover:border-primary/30 transition-all hover:translate-y-[-2px] duration-300 relative group overflow-hidden"
            >
              {/* Subtle accent hover glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <Link to={`/group/${group.id}`} className="flex flex-col h-full justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-xl font-bold text-textMain group-hover:text-primary transition-colors line-clamp-1 leading-snug">
                      {group.title}
                    </h3>
                    <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shrink-0 border ${
                      group.status === 'Open' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      group.status === 'Ordered' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                      group.status === 'Delivered' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    }`}>
                      {group.status}
                    </span>
                  </div>

                  <p className="text-textMuted text-xs leading-relaxed line-clamp-2">
                    {group.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-surfaceBorder/30 flex items-center justify-between text-xs text-textMuted">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-primary/70" />
                      <span className="font-semibold text-textMain">{group.members.length}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Target className="w-3.5 h-3.5 text-primary/70" />
                      <span className="font-semibold text-textMain">{group.totalGoodsTarget}</span>
                    </span>
                  </div>
                  <span className="inline-flex items-center space-x-1 text-primary group-hover:translate-x-1 transition-transform">
                    <span className="font-semibold">Manage</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
