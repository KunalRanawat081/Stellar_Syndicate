import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGroups } from '../hooks/useGroups';
import { useWallet } from '../context/WalletContext';
import { calculateSettlements } from '../utils/settlement';
import { addMemberOnChain, markPaidOnChain, getGroupFromContract, listenToContractEvents } from '../utils/soroban';
import * as StellarSdk from '@stellar/stellar-sdk';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { motion } from 'framer-motion';
import { Calculator, DollarSign, Users, CheckCircle2, ShieldCheck, RefreshCw, Plus, CreditCard } from 'lucide-react';
import LoadingOverlay from '../components/LoadingOverlay';

const GroupDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { address } = useWallet();
  const { getGroup, updateGroup } = useGroups();

  const group = getGroup(id || '');

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAddress, setNewMemberAddress] = useState('');
  const [newMemberAmount, setNewMemberAmount] = useState(0);

  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmt, setExpenseAmt] = useState(0);
  const [expenseType, setExpenseType] = useState<'fixed' | 'variable'>('fixed');

  // Blockchain States
  const [isVerifiedOnChain, setIsVerifiedOnChain] = useState(false);
  const [isRefreshingChain, setIsRefreshingChain] = useState(false);

  // Transaction States
  const [txStatus, setTxStatus] = useState<'pending' | 'success' | 'failed' | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [overlayTitle, setOverlayTitle] = useState('Processing Transaction');

  const settlements = useMemo(() => (group ? calculateSettlements(group) : []), [group]);

  // Check if group is registered on-chain
  const checkOnChainStatus = async () => {
    if (!id) return;
    setIsRefreshingChain(true);
    const onChainGroup = await getGroupFromContract(id);
    if (onChainGroup) {
      setIsVerifiedOnChain(true);
    } else {
      setIsVerifiedOnChain(false);
    }
    setIsRefreshingChain(false);
  };

  useEffect(() => {
    checkOnChainStatus();

    // Listen to real-time events for this contract
    const unsubscribe = listenToContractEvents((event) => {
      console.log('Contract Event Received:', event);
      // Auto-refresh on-chain status when events are observed
      checkOnChainStatus();
    });

    // Auto-polling backup every 10 seconds to keep UI state fresh
    const pollInterval = setInterval(() => {
      checkOnChainStatus();
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [id]);

  if (!group) return <div className="text-center py-20 text-textMuted">Group not found</div>;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      alert('Please connect your wallet first.');
      return;
    }

    const memberId = Math.random().toString(36).substring(7);

    setOverlayTitle('Adding Member On-Chain');
    setIsOverlayOpen(true);
    setTxStatus('pending');
    setTxHash(null);
    setTxError(null);

    try {
      // Validate address
      try {
        new StellarSdk.Address(newMemberAddress);
      } catch {
        throw new Error('Invalid Stellar address format.');
      }

      // 1. Submit Soroban transaction to add member on-chain
      const hash = await addMemberOnChain(
        group.id,
        memberId,
        newMemberAddress,
        newMemberAmount,
        address
      );

      setTxHash(hash);
      setTxStatus('success');

      // 2. Update local storage representation
      const updated = {
        ...group,
        members: [
          ...group.members,
          {
            id: memberId,
            name: newMemberName,
            address: newMemberAddress,
            orderAmount: newMemberAmount,
            hasPaid: false,
          },
        ],
      };
      updateGroup(updated);

      setNewMemberName('');
      setNewMemberAddress('');
      setNewMemberAmount(0);
    } catch (err: any) {
      console.error(err);
      setTxStatus('failed');
      setTxError(err.message || 'Failed to add member on the blockchain.');
    }
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...group,
      expenses: [
        ...group.expenses,
        {
          id: Math.random().toString(36).substring(7),
          description: expenseDesc,
          amount: expenseAmt,
          isFixed: expenseType === 'fixed',
        },
      ],
    };
    updateGroup(updated);
    setExpenseDesc('');
    setExpenseAmt(0);
  };

  const handlePay = async (memberId: string, amount: number) => {
    if (!address) {
      alert('Please connect your wallet first.');
      return;
    }

    setOverlayTitle('Processing Co-op Payment');
    setIsOverlayOpen(true);
    setTxStatus('pending');
    setTxHash(null);
    setTxError(null);

    try {
      const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

      // 1. Validate balance before starting payment
      let sourceAccount;
      try {
        sourceAccount = await server.loadAccount(address);
      } catch (e: any) {
        if (e.response && e.response.status === 404) {
          throw new Error('Your account is unfunded on Testnet. Please fund it first.');
        }
        throw e;
      }

      const nativeBal = sourceAccount.balances.find((b) => b.asset_type === 'native');
      const balanceNum = nativeBal ? parseFloat(nativeBal.balance) : 0;
      if (balanceNum < amount + 0.01) {
        throw new Error(`Insufficient XLM balance. You need at least ${amount.toFixed(2)} XLM.`);
      }

      // 2. Build payment transaction
      const networkPassphrase = StellarSdk.Networks.TESTNET;
      const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: group.leadBuyer,
            asset: StellarSdk.Asset.native(),
            amount: amount.toFixed(7),
          })
        )
        .setTimeout(30)
        .build();

      // 3. Sign XLM Payment using StellarWalletsKit
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(tx.toXDR(), {
        networkPassphrase,
        address,
      });

      const transactionToSubmit = StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase);
      await server.submitTransaction(transactionToSubmit);

      // 4. Update the Smart Contract state using markPaidOnChain
      const contractHash = await markPaidOnChain(group.id, memberId, address);

      setTxHash(contractHash);
      setTxStatus('success');

      // 5. Update local storage
      const updated = {
        ...group,
        members: group.members.map((m) => (m.id === memberId ? { ...m, hasPaid: true } : m)),
      };
      updateGroup(updated);
    } catch (err: any) {
      console.error(err);
      setTxStatus('failed');
      const msg = err.message || String(err);
      if (msg.includes('rejected') || msg.includes('cancel')) {
        setTxError('Payment request was rejected by user.');
      } else {
        setTxError(msg);
      }
    }
  };

  const handleOverlayClose = () => {
    setIsOverlayOpen(false);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Title Header Card */}
      <div className="bg-surface p-8 rounded-2xl border border-surfaceHover relative overflow-hidden">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-textMain">{group.title}</h1>
            <p className="text-textMuted max-w-2xl">{group.description}</p>
            <div className="flex items-center space-x-4 pt-2 text-sm flex-wrap gap-y-2">
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full font-medium">
                Status: {group.status}
              </span>
              <span className="text-textMuted">
                Lead: <span className="font-mono">{group.leadBuyer.substring(0, 6)}...{group.leadBuyer.substring(group.leadBuyer.length - 4)}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-background border border-surfaceHover px-4 py-2 rounded-xl">
            {isVerifiedOnChain ? (
              <div className="flex items-center space-x-1.5 text-green-400">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span className="text-sm font-semibold">On-chain Verified</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 text-yellow-400">
                <RefreshCw className={`w-4 h-4 shrink-0 ${isRefreshingChain ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">Verifying Chain...</span>
              </div>
            )}
            <button
              onClick={checkOnChainStatus}
              disabled={isRefreshingChain}
              className="text-xs text-textMuted hover:text-textMain underline ml-2 transition-colors cursor-pointer"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Members Section */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2 text-xl font-bold text-textMain">
            <Users className="text-primary w-5 h-5" />
            <h2>Members & Orders</h2>
          </div>

          <div className="bg-surface rounded-xl border border-surfaceHover overflow-hidden shadow-sm">
            {group.members.length === 0 ? (
              <div className="p-6 text-center text-textMuted">No members yet. Add members to start.</div>
            ) : (
              <ul className="divide-y divide-surfaceHover">
                {group.members.map((m) => (
                  <li key={m.id} className="p-4 flex justify-between items-center hover:bg-surfaceHover/30 transition-colors">
                    <div>
                      <p className="font-bold text-textMain">{m.name}</p>
                      <p className="text-xs text-textMuted font-mono">{m.address.substring(0, 10)}...</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-textMain">{m.orderAmount} units</p>
                      {m.hasPaid ? (
                        <span className="text-xs font-semibold text-green-400 flex items-center justify-end space-x-1">
                          <CheckCircle2 className="w-3 h-3" /> <span>Paid</span>
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-yellow-500">Unpaid</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={handleAddMember} className="bg-surface p-6 rounded-xl border border-surfaceHover space-y-4 shadow-sm">
            <h3 className="font-bold text-textMain flex items-center space-x-1.5">
              <Plus className="w-4 h-4 text-primary" /> <span>Add On-chain Member</span>
            </h3>
            <input
              type="text"
              placeholder="Name (e.g. Alice Coffee)"
              required
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="w-full bg-background border border-surfaceHover rounded-lg px-4 py-2 text-textMain focus:outline-none focus:border-primary transition-colors text-sm"
            />
            <input
              type="text"
              placeholder="Stellar Public Key (G...)"
              required
              value={newMemberAddress}
              onChange={(e) => setNewMemberAddress(e.target.value)}
              className="w-full bg-background border border-surfaceHover rounded-lg px-4 py-2 text-textMain focus:outline-none focus:border-primary transition-colors text-sm font-mono"
            />
            <input
              type="number"
              placeholder="Units Ordered"
              required
              min="1"
              value={newMemberAmount || ''}
              onChange={(e) => setNewMemberAmount(parseInt(e.target.value) || 0)}
              className="w-full bg-background border border-surfaceHover rounded-lg px-4 py-2 text-textMain focus:outline-none focus:border-primary transition-colors text-sm"
            />
            <button
              type="submit"
              className="w-full bg-surfaceHover hover:bg-surface text-textMain font-medium py-2.5 rounded-lg transition-colors border border-surfaceHover cursor-pointer text-sm shadow-sm"
            >
              Add Member
            </button>
          </form>
        </div>

        {/* Expenses Section */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2 text-xl font-bold text-textMain">
            <DollarSign className="text-primary w-5 h-5" />
            <h2>Expenses</h2>
          </div>

          <div className="bg-surface rounded-xl border border-surfaceHover overflow-hidden shadow-sm">
            {group.expenses.length === 0 ? (
              <div className="p-6 text-center text-textMuted">No expenses logged. Add overhead expenses below.</div>
            ) : (
              <ul className="divide-y divide-surfaceHover">
                {group.expenses.map((e) => (
                  <li key={e.id} className="p-4 flex justify-between items-center hover:bg-surfaceHover/30 transition-colors">
                    <div>
                      <p className="font-bold text-textMain">{e.description}</p>
                      <p className="text-xs text-textMuted">
                        {e.isFixed ? 'Fixed (Split equally)' : 'Variable (Split by units)'}
                      </p>
                    </div>
                    <div className="font-semibold text-red-400">${e.amount.toFixed(2)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={handleAddExpense} className="bg-surface p-6 rounded-xl border border-surfaceHover space-y-4 shadow-sm">
            <h3 className="font-bold text-textMain">Add Expense</h3>
            <input
              type="text"
              placeholder="Description (e.g. Import Duties)"
              required
              value={expenseDesc}
              onChange={(e) => setExpenseDesc(e.target.value)}
              className="w-full bg-background border border-surfaceHover rounded-lg px-4 py-2 text-textMain focus:outline-none focus:border-primary transition-colors text-sm"
            />
            <div className="flex space-x-4">
              <input
                type="number"
                placeholder="Amount ($)"
                required
                min="0.01"
                step="0.01"
                value={expenseAmt || ''}
                onChange={(e) => setExpenseAmt(parseFloat(e.target.value) || 0)}
                className="w-full bg-background border border-surfaceHover rounded-lg px-4 py-2 text-textMain focus:outline-none focus:border-primary transition-colors text-sm"
              />
              <select
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value as any)}
                className="bg-background border border-surfaceHover rounded-lg px-4 py-2 text-textMain text-sm"
              >
                <option value="fixed">Fixed</option>
                <option value="variable">Variable</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-surfaceHover hover:bg-surface text-textMain font-medium py-2.5 rounded-lg transition-colors border border-surfaceHover cursor-pointer text-sm shadow-sm"
            >
              Add Expense
            </button>
          </form>
        </div>
      </div>

      {/* Settlements Section */}
      {settlements.length > 0 && (
        <div className="space-y-6 pt-8 border-t border-surfaceHover">
          <div className="flex items-center space-x-2 text-xl font-bold text-textMain">
            <Calculator className="text-primary w-5 h-5" />
            <h2>Co-op Settlements</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {settlements.map((s, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={s.memberId}
                className={`bg-surface p-6 rounded-xl border flex flex-col justify-between ${
                  s.hasPaid ? 'border-green-500/30' : 'border-surfaceHover'
                } shadow-sm`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-textMain">{s.memberName}</h3>
                      <p className="text-xs text-textMuted font-mono">{s.address.substring(0, 12)}...</p>
                    </div>
                    {s.hasPaid && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                  </div>

                  <div className="space-y-2 text-sm text-textMuted mb-4">
                    <div className="flex justify-between">
                      <span>Fixed Share:</span>
                      <span>${s.fixedCostShare.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Variable Share:</span>
                      <span>${s.variableCostShare.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-surfaceHover">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-textMain">Total Owed:</span>
                    <span className="font-bold text-lg text-textMain">${s.totalOwed.toFixed(2)}</span>
                  </div>

                  {!s.hasPaid && address === s.address && (
                    <button
                      onClick={() => handlePay(s.memberId, s.totalOwed)}
                      className="w-full bg-primary hover:bg-primaryHover text-white py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-md hover:shadow-primary/10"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Settle & Pay {s.totalOwed.toFixed(2)} XLM</span>
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <LoadingOverlay
        isOpen={isOverlayOpen}
        status={txStatus}
        txHash={txHash}
        errorMessage={txError}
        onClose={handleOverlayClose}
        title={overlayTitle}
      />
    </div>
  );
};

export default GroupDetails;
