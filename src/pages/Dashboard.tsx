import React from 'react';
import { Link } from 'react-router-dom';
import { useGroups } from '../hooks/useGroups';
import { useWallet } from '../context/WalletContext';
import { motion } from 'framer-motion';
import { Plus, FolderOpen } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { address } = useWallet();
  const { groups } = useGroups();

  const userGroups = groups.filter(g => 
    g.leadBuyer === address || g.members.some(m => m.address === address)
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Syndicates</h1>
        <Link
          to="/create-group"
          className="flex items-center space-x-2 bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Group</span>
        </Link>
      </div>

      {userGroups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-textMuted bg-surface rounded-xl border border-dashed border-surfaceHover"
        >
          <FolderOpen className="w-16 h-16 mb-4 text-surfaceHover" />
          <h2 className="text-xl font-medium mb-2">No groups yet</h2>
          <p className="max-w-md text-center">
            You haven't joined or created any purchasing syndicates. Create one to get started!
          </p>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userGroups.map((group, idx) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-surface rounded-xl p-6 border border-surfaceHover hover:border-primary/30 transition-all cursor-pointer group"
            >
              <Link to={`/group/${group.id}`} className="block h-full">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                    {group.title}
                  </h3>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    group.status === 'Open' ? 'bg-green-500/10 text-green-400' :
                    group.status === 'Ordered' ? 'bg-yellow-500/10 text-yellow-400' :
                    group.status === 'Delivered' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-gray-500/10 text-gray-400'
                  }`}>
                    {group.status}
                  </span>
                </div>
                <p className="text-textMuted line-clamp-2 text-sm mb-4">
                  {group.description}
                </p>
                <div className="text-sm font-medium text-textMain flex items-center justify-between border-t border-surfaceHover pt-4">
                  <span>Members: {group.members.length}</span>
                  <span>Target: {group.totalGoodsTarget} units</span>
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
