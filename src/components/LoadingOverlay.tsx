import React from 'react';
import { Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingOverlayProps {
  isOpen: boolean;
  status: 'pending' | 'success' | 'failed' | null;
  txHash: string | null;
  errorMessage: string | null;
  onClose: () => void;
  title?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isOpen,
  status,
  txHash,
  errorMessage,
  onClose,
  title = 'Processing Transaction',
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-surface border border-surfaceHover w-full max-w-md p-6 rounded-2xl shadow-xl flex flex-col items-center text-center space-y-6"
        >
          <h3 className="text-xl font-bold tracking-wide text-textMain">{title}</h3>

          {status === 'pending' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <p className="text-textMain font-medium">Submitting transaction to Stellar Testnet...</p>
              <p className="text-textMuted text-sm">Please sign the request in your wallet and wait for network confirmation.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-400" />
              <p className="text-green-400 font-bold text-lg">Transaction Succeeded!</p>
              <p className="text-textMuted text-sm">The operation has been successfully recorded on the Stellar ledger.</p>
            </div>
          )}

          {status === 'failed' && (
            <div className="flex flex-col items-center space-y-4 w-full">
              <XCircle className="w-16 h-16 text-red-400" />
              <p className="text-red-400 font-bold text-lg">Transaction Failed</p>
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-4 rounded-xl w-full text-left font-mono break-all max-h-32 overflow-y-auto">
                {errorMessage || 'Unknown error occurred.'}
              </div>
            </div>
          )}

          {txHash && (
            <div className="w-full pt-4 border-t border-surfaceHover flex flex-col items-center space-y-2">
              <span className="text-xs text-textMuted font-mono">Transaction Hash:</span>
              <span className="text-xs text-textMain font-mono bg-surfaceHover px-3 py-1.5 rounded-lg select-all break-all w-full">
                {txHash}
              </span>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-primary hover:text-primaryHover text-sm font-semibold transition-colors mt-2"
              >
                <span>View on Stellar Expert</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {status !== 'pending' && (
            <button
              onClick={onClose}
              className="w-full bg-primary hover:bg-primaryHover text-white py-3 rounded-xl font-semibold transition-all cursor-pointer shadow-lg hover:shadow-primary/20"
            >
              Close
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LoadingOverlay;
