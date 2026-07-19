import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGroups } from '../hooks/useGroups';
import { useWallet } from '../context/WalletContext';
import { calculateSettlements } from '../utils/settlement';
import { addMemberOnChain, markPaidOnChain, getGroupFromContract, listenToContractEvents } from '../utils/soroban';
import * as StellarSdk from '@stellar/stellar-sdk';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { motion } from 'framer-motion';
import { Calculator, DollarSign, Users, CheckCircle2, ShieldCheck, RefreshCw, Plus, CreditCard, Copy, ChevronLeft } from 'lucide-react';
import LoadingOverlay from '../components/LoadingOverlay';
import { Link } from 'react-router-dom';

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
  const [eventsList, setEventsList] = useState<any[]>([]);

  // Transaction States
  const [txStatus, setTxStatus] = useState<'pending' | 'success' | 'failed' | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [overlayTitle, setOverlayTitle] = useState('Processing Transaction');

  const settlements = useMemo(() => (group ? calculateSettlements(group) : []), [group]);

  const parseContractEvent = (ev: any) => {
    try {
      const topics = ev.topic.map((t: any) => StellarSdk.scValToNative(t));
      const value = StellarSdk.scValToNative(ev.value);
      const eventType = topics[0];

      if (eventType === 'create_group') {
        const gId = topics[1];
        return {
          id: ev.id,
          txHash: ev.txHash,
          ledger: ev.ledger,
          timestamp: ev.ledgerClosedAt || new Date().toISOString(),
          message: `Syndicate group "${gId}" registered on-chain by lead buyer.`,
          type: 'info'
        };
      } else if (eventType === 'add_member') {
        const mId = topics[2];
        const mAddr = value[0] || '';
        const orderAmount = value[1] || 0;
        return {
          id: ev.id,
          txHash: ev.txHash,
          ledger: ev.ledger,
          timestamp: ev.ledgerClosedAt || new Date().toISOString(),
          message: `Member "${mId}" (${mAddr.substring(0, 6)}...) added with order of ${orderAmount} units.`,
          type: 'success'
        };
      } else if (eventType === 'mark_paid') {
        const mId = topics[2];
        return {
          id: ev.id,
          txHash: ev.txHash,
          ledger: ev.ledger,
          timestamp: ev.ledgerClosedAt || new Date().toISOString(),
          message: `Member "${mId}" payment marked as settled on-chain.`,
          type: 'success'
        };
      }
      
      return {
        id: ev.id,
        txHash: ev.txHash,
        ledger: ev.ledger,
        timestamp: ev.ledgerClosedAt || new Date().toISOString(),
        message: `On-chain event [${eventType}] emitted for group.`,
        type: 'info'
      };
    } catch (err) {
      console.error('Failed to parse event:', err);
      return null;
    }
  };

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
      checkOnChainStatus();

      const parsed = parseContractEvent(event);
      if (parsed) {
        try {
          const topics = event.topic.map((t: any) => StellarSdk.scValToNative(t));
          if (topics[1] === id) {
            setEventsList((prev) => {
              if (prev.some((e) => e.id === parsed.id)) return prev;
              return [parsed, ...prev];
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
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

  if (!group) return <div className="text-center py-24 text-textMuted font-bold">Group not found</div>;

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
      const tokenAddress = 'CDLZFC3SYJYDZT7K67VZ75HPJGW5ZTYF2MYTCH2W3ZPN77O3JJV26UCA';
      const contractHash = await markPaidOnChain(group.id, memberId, tokenAddress, address);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Back Button */}
      <div className="flex items-center">
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 text-textMuted hover:text-textMain transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Title Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 rounded-3xl shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="absolute top-0 right-0 w-80 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3 relative z-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gradient leading-tight">{group.title}</h1>
          <p className="text-textMuted text-sm max-w-2xl leading-relaxed">{group.description}</p>
          <div className="flex items-center space-x-4 pt-1 flex-wrap gap-y-2">
            <span className="bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shrink-0">
              Status: {group.status}
            </span>
            <span className="text-xs text-textMuted font-medium flex items-center space-x-1">
              <span>Lead Buyer:</span>
              <span className="font-mono text-textMain bg-surfaceHover px-2 py-0.5 rounded border border-surfaceBorder/40">
                {group.leadBuyer.substring(0, 6)}...{group.leadBuyer.substring(group.leadBuyer.length - 4)}
              </span>
            </span>
          </div>
        </div>

        {/* Verification Status */}
        <div className="relative z-10 shrink-0">
          {isVerifiedOnChain ? (
            <div className="flex items-center space-x-2.5 bg-green-500/10 border border-green-500/20 text-green-400 px-5 py-3 rounded-2xl shadow-sm shadow-green-500/5">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span className="text-sm font-bold tracking-wide">On-Chain Active</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-5 py-3 rounded-2xl shadow-sm shadow-yellow-500/5">
              <RefreshCw className={`w-4 h-4 shrink-0 ${isRefreshingChain ? 'animate-spin' : ''}`} />
              <span className="text-sm font-semibold">Resolving Chain...</span>
            </div>
          )}
          <button
            onClick={checkOnChainStatus}
            disabled={isRefreshingChain}
            className="text-xs text-primary hover:text-primaryHover font-semibold underline block text-right mt-2 mr-1 transition-colors cursor-pointer"
          >
            Manual Sync
          </button>
        </div>
      </motion.div>

      {/* Main Grid: Members & Expenses */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Members Column */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2.5 text-xl font-bold text-textMain">
            <Users className="text-primary w-5 h-5" />
            <h2>Members & Orders</h2>
          </div>

          <div className="glass-panel border-surfaceBorder/40 rounded-3xl overflow-hidden shadow-lg">
            {group.members.length === 0 ? (
              <div className="p-10 text-center text-textMuted/80 text-sm">
                No members found. Use the form below to record a member on-chain.
              </div>
            ) : (
              <ul className="divide-y divide-surfaceBorder/20">
                {group.members.map((m, idx) => (
                  <motion.li
                    key={m.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-5 flex justify-between items-center hover:bg-surfaceHover/30 transition-all group"
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-textMain text-sm">{m.name}</p>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs text-textMuted font-mono">
                          {m.address.substring(0, 10)}...{m.address.substring(m.address.length - 8)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(m.address)}
                          className="text-textMuted hover:text-textMain opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded cursor-pointer"
                          title="Copy Address"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold text-textMain text-sm">{m.orderAmount} units</p>
                      {m.hasPaid ? (
                        <span className="text-xs font-bold text-green-400 flex items-center justify-end space-x-1 bg-green-500/10 px-2.5 py-0.5 rounded-full border border-green-500/15">
                          <CheckCircle2 className="w-3 h-3" /> <span>Paid</span>
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2.5 py-0.5 rounded-full border border-yellow-500/15">
                          Unpaid
                        </span>
                      )}
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>

          {/* Add Member Form */}
          <form
            onSubmit={handleAddMember}
            className="glass-panel border-surfaceBorder/40 p-6 rounded-3xl space-y-4 shadow-lg"
          >
            <h3 className="font-bold text-textMain text-md flex items-center space-x-1.5">
              <Plus className="w-4 h-4 text-primary" /> <span>Register Member On-Chain</span>
            </h3>
            
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Name (e.g. Alice Coffee)"
                required
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="w-full bg-background border border-surfaceBorder/50 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-textMain text-xs"
              />
              <input
                type="text"
                placeholder="Stellar Public Key (G...)"
                required
                value={newMemberAddress}
                onChange={(e) => setNewMemberAddress(e.target.value)}
                className="w-full bg-background border border-surfaceBorder/50 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-textMain text-xs font-mono"
              />
              <input
                type="number"
                placeholder="Order Units Amount"
                required
                min="1"
                value={newMemberAmount || ''}
                onChange={(e) => setNewMemberAmount(parseInt(e.target.value) || 0)}
                className="w-full bg-background border border-surfaceBorder/50 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-textMain text-xs"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-surfaceHover hover:bg-surfaceBorder text-textMain font-bold py-3 rounded-2xl transition-all border border-surfaceBorder/60 cursor-pointer text-xs active:scale-[0.98] shadow-sm"
            >
              Submit On-Chain Transaction
            </button>
          </form>
        </div>

        {/* Expenses Column */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2.5 text-xl font-bold text-textMain">
            <DollarSign className="text-primary w-5 h-5" />
            <h2>Shared Expenses & Overheads</h2>
          </div>

          <div className="glass-panel border-surfaceBorder/40 rounded-3xl overflow-hidden shadow-lg">
            {group.expenses.length === 0 ? (
              <div className="p-10 text-center text-textMuted/80 text-sm">
                No overhead expenses logged yet. Split custom shipping/logistics charges below.
              </div>
            ) : (
              <ul className="divide-y divide-surfaceBorder/20">
                {group.expenses.map((e, idx) => (
                  <motion.li
                    key={e.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-5 flex justify-between items-center hover:bg-surfaceHover/30 transition-all"
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-textMain text-sm">{e.description}</p>
                      <p className="text-xs text-textMuted font-medium bg-surfaceHover/80 border border-surfaceBorder/30 px-2 py-0.5 rounded-full inline-block">
                        {e.isFixed ? 'Fixed Split' : 'Weighted Split'}
                      </p>
                    </div>
                    <div className="font-bold text-red-400 text-sm">${e.amount.toFixed(2)}</div>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>

          {/* Add Expense Form */}
          <form
            onSubmit={handleAddExpense}
            className="glass-panel border-surfaceBorder/40 p-6 rounded-3xl space-y-4 shadow-lg"
          >
            <h3 className="font-bold text-textMain text-md flex items-center space-x-1.5">
              <Plus className="w-4 h-4 text-primary" /> <span>Add Expense Invoice</span>
            </h3>

            <input
              type="text"
              placeholder="Description (e.g. FedEx Shipping Fee)"
              required
              value={expenseDesc}
              onChange={(e) => setExpenseDesc(e.target.value)}
              className="w-full bg-background border border-surfaceBorder/50 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-textMain text-xs"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Amount ($)"
                required
                min="0.01"
                step="0.01"
                value={expenseAmt || ''}
                onChange={(e) => setExpenseAmt(parseFloat(e.target.value) || 0)}
                className="w-full bg-background border border-surfaceBorder/50 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-textMain text-xs"
              />
              <select
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value as any)}
                className="bg-background border border-surfaceBorder/50 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-all text-textMain text-xs"
              >
                <option value="fixed">Split Equally</option>
                <option value="variable">Split by Volume</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-surfaceHover hover:bg-surfaceBorder text-textMain font-bold py-3 rounded-2xl transition-all border border-surfaceBorder/60 cursor-pointer text-xs active:scale-[0.98] shadow-sm"
            >
              Log Expense
            </button>
          </form>
        </div>
      </div>

      {/* Settlements Section */}
      {settlements.length > 0 && (
        <div className="space-y-6 pt-10 border-t border-surfaceBorder/40">
          <div className="flex items-center space-x-2.5 text-xl font-bold text-textMain">
            <Calculator className="text-primary w-5 h-5" />
            <h2>Co-op Cost Settlement Cards</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {settlements.map((s, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                key={s.memberId}
                className={`glass-panel p-6 rounded-3xl border flex flex-col justify-between transition-all shadow-md relative overflow-hidden ${
                  s.hasPaid ? 'border-green-500/25 bg-green-500/[0.02]' : 'border-surfaceBorder/50'
                }`}
              >
                {s.hasPaid && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/5 rounded-full blur-xl pointer-events-none" />
                )}

                <div>
                  <div className="flex justify-between items-start mb-5">
                    <div className="space-y-1">
                      <h3 className="font-bold text-textMain text-md">{s.memberName}</h3>
                      <p className="text-xs text-textMuted font-mono">
                        {s.address.substring(0, 6)}...{s.address.substring(s.address.length - 4)}
                      </p>
                    </div>
                    {s.hasPaid && (
                      <span className="bg-green-500/10 p-1.5 rounded-full border border-green-500/20">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5 text-xs text-textMuted mb-6 pt-1">
                    <div className="flex justify-between">
                      <span>Fixed Expense Share:</span>
                      <span className="font-mono text-textMain">${s.fixedCostShare.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Volume Expense Share:</span>
                      <span className="font-mono text-textMain">${s.variableCostShare.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-surfaceBorder/30">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-sm text-textMain uppercase tracking-wide">Total Owed:</span>
                    <span className="font-extrabold text-lg text-primary font-mono">${s.totalOwed.toFixed(2)}</span>
                  </div>

                  {!s.hasPaid && address === s.address && (
                    <button
                      onClick={() => handlePay(s.memberId, s.totalOwed)}
                      className="w-full bg-primary hover:bg-primaryHover text-white py-3 rounded-2xl font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] outline-none"
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

      {/* On-Chain Events Feed */}
      <div className="space-y-6 pt-10 border-t border-surfaceBorder/40">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center space-x-2.5 text-xl font-bold text-textMain">
            <ShieldCheck className="text-primary w-5 h-5" />
            <h2>On-Chain Activity Feed</h2>
          </div>
          <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center space-x-1.5 shrink-0">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
            <span>Streaming Events</span>
          </span>
        </div>

        <div className="glass-panel border-surfaceBorder/40 rounded-3xl overflow-hidden shadow-lg max-h-[320px] overflow-y-auto custom-scrollbar">
          {eventsList.length === 0 ? (
            <div className="p-10 text-center text-textMuted/80 text-sm">
              Listening for real-time ledger events...
            </div>
          ) : (
            <ul className="divide-y divide-surfaceBorder/20">
              {eventsList.map((e, idx) => (
                <motion.li
                  key={e.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-5 hover:bg-surfaceHover/15 transition-all text-xs flex flex-col space-y-2.5"
                >
                  <div className="flex justify-between items-center flex-wrap gap-2 text-textMuted font-semibold">
                    <span>Ledger Seq: #{e.ledger}</span>
                    <span className="font-mono bg-background px-2 py-0.5 rounded border border-surfaceBorder/40 select-all">
                      Tx: {e.txHash.substring(0, 12)}...{e.txHash.substring(e.txHash.length - 4)}
                    </span>
                  </div>
                  <p className="text-textMain font-medium leading-relaxed">{e.message}</p>
                  <div>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${e.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primaryHover font-bold inline-flex items-center space-x-1 outline-none"
                    >
                      <span>Verify on Stellar Expert</span>
                    </a>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>

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
