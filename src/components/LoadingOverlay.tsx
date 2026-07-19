import React from 'react';
import { CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
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
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030303]/80 backdrop-blur-md p-4">
          {/* Backdrop click protection */}
          <div className="absolute inset-0" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="glass-panel border-surfaceBorder/40 w-full max-w-md p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center space-y-6 relative overflow-hidden"
          >
            {/* Header glow background */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <h3 className="text-2xl font-extrabold tracking-tight text-gradient relative z-10">{title}</h3>

            {status === 'pending' && (
              <div className="flex flex-col items-center space-y-5 relative z-10">
                {/* SVG Animated Circular Ring */}
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full animate-spin" viewBox="0 0 50 50">
                    <circle
                      className="text-surfaceBorder"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="transparent"
                      r="20"
                      cx="25"
                      cy="25"
                    />
                    <circle
                      className="text-primary"
                      strokeWidth="4"
                      strokeDasharray="80 150"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="20"
                      cx="25"
                      cy="25"
                    />
                  </svg>
                </div>
                <div className="space-y-1.5">
                  <p className="text-textMain font-semibold text-lg">Submitting to Stellar Network...</p>
                  <p className="text-textMuted text-xs leading-relaxed max-w-xs">
                    Please review and sign the transaction prompt in your wallet extension.
                  </p>
                </div>
              </div>
            )}

            {status === 'success' && (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center space-y-4 relative z-10"
              >
                <div className="bg-green-500/10 p-4 rounded-full border border-green-500/20">
                  <CheckCircle2 className="w-12 h-12 text-green-400" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-green-400 font-bold text-xl">Transaction Approved</p>
                  <p className="text-textMuted text-xs max-w-xs">
                    The ledger state has updated. The settlement is confirmed on-chain.
                  </p>
                </div>
              </motion.div>
            )}

            {status === 'failed' && (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center space-y-4 w-full relative z-10"
              >
                <div className="bg-red-500/10 p-4 rounded-full border border-red-500/20">
                  <XCircle className="w-12 h-12 text-red-400" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-red-400 font-bold text-xl">Transaction Failed</p>
                </div>
                <div className="bg-[#050508] border border-surfaceBorder text-red-300 text-xs p-4 rounded-2xl w-full text-left font-mono break-all max-h-36 overflow-y-auto custom-scrollbar leading-relaxed">
                  {errorMessage || 'An error occurred during submission.'}
                </div>
              </motion.div>
            )}

            {txHash && (
              <div className="w-full pt-5 border-t border-surfaceBorder/40 flex flex-col items-center space-y-2 relative z-10">
                <span className="text-[10px] text-textMuted font-semibold uppercase tracking-wider">
                  Transaction Hash
                </span>
                <span className="text-xs text-textMain font-mono bg-background px-3 py-2 rounded-xl select-all break-all w-full border border-surfaceBorder/30">
                  {txHash}
                </span>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-primary hover:text-primaryHover text-sm font-semibold transition-colors mt-2"
                >
                  <span>View on Stellar Expert</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}

            {status !== 'pending' && (
              <button
                onClick={onClose}
                className="w-full bg-primary hover:bg-primaryHover text-white py-3.5 rounded-2xl font-bold transition-all cursor-pointer shadow-lg hover:shadow-primary/20 relative z-10 active:scale-[0.98] outline-none focus:ring-2 focus:ring-primary/40"
              >
                Continue
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoadingOverlay;
