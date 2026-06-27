import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useGroups } from '../hooks/useGroups';
import { useWallet } from '../context/WalletContext';
import { calculateSettlements } from '../utils/settlement';
import { signTransaction } from '@stellar/freighter-api';
import * as StellarSdk from '@stellar/stellar-sdk';
import { motion } from 'framer-motion';
import { Calculator, DollarSign, Users, CheckCircle2 } from 'lucide-react';

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

  const settlements = useMemo(() => group ? calculateSettlements(group) : [], [group]);

  if (!group) return <div>Group not found</div>;

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...group,
      members: [...group.members, {
        id: Math.random().toString(36).substring(7),
        name: newMemberName,
        address: newMemberAddress,
        orderAmount: newMemberAmount,
        hasPaid: false
      }]
    };
    updateGroup(updated);
    setNewMemberName('');
    setNewMemberAddress('');
    setNewMemberAmount(0);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...group,
      expenses: [...group.expenses, {
        id: Math.random().toString(36).substring(7),
        description: expenseDesc,
        amount: expenseAmt,
        isFixed: expenseType === 'fixed'
      }]
    };
    updateGroup(updated);
    setExpenseDesc('');
    setExpenseAmt(0);
  };

  const handlePay = async (memberId: string, amount: number) => {
    if (!address) {
      alert("Please connect your wallet first.");
      return;
    }
    
    try {
      const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
      
      // Load the sender's account sequence number
      const sourceAccount = await server.loadAccount(address);
      const networkPassphrase = StellarSdk.Networks.TESTNET;

      // Build the transaction
      const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase,
      })
      .addOperation(StellarSdk.Operation.payment({
        destination: group.leadBuyer,
        asset: StellarSdk.Asset.native(),
        amount: amount.toFixed(7)
      }))
      .setTimeout(30)
      .build();

      // Sign the transaction via Freighter
      const signResponse = await signTransaction(tx.toXDR(), { networkPassphrase });
      
      if (signResponse.error) {
        throw new Error(signResponse.error as string);
      }
      
      if (!signResponse.signedTxXdr) {
        throw new Error("Freighter did not return a signed transaction XDR.");
      }

      // Submit the transaction
      const transactionToSubmit = StellarSdk.TransactionBuilder.fromXDR(signResponse.signedTxXdr, networkPassphrase);
      await server.submitTransaction(transactionToSubmit);

      alert(`Payment successful!`);
      
      const updated = {
        ...group,
        members: group.members.map(m => m.id === memberId ? { ...m, hasPaid: true } : m)
      };
      updateGroup(updated);
    } catch (e: any) {
      console.error(e);
      alert(`Payment failed: ${e.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-surface p-8 rounded-2xl border border-surfaceHover">
        <h1 className="text-3xl font-bold">{group.title}</h1>
        <p className="text-textMuted mt-2">{group.description}</p>
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <span className="bg-primary/20 text-primary px-3 py-1 rounded-full font-medium">
            Status: {group.status}
          </span>
          <span className="text-textMuted">
            Lead Buyer: {group.leadBuyer.substring(0, 4)}...{group.leadBuyer.substring(group.leadBuyer.length - 4)}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Members Section */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2 text-xl font-bold">
            <Users className="text-primary" />
            <h2>Members & Orders</h2>
          </div>
          
          <div className="bg-surface rounded-xl border border-surfaceHover overflow-hidden">
            {group.members.length === 0 ? (
              <div className="p-6 text-center text-textMuted">No members yet.</div>
            ) : (
              <ul className="divide-y divide-surfaceHover">
                {group.members.map(m => (
                  <li key={m.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold">{m.name}</p>
                      <p className="text-xs text-textMuted">{m.address.substring(0,6)}...</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{m.orderAmount} units</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={handleAddMember} className="bg-surface p-6 rounded-xl border border-surfaceHover space-y-4">
            <h3 className="font-bold">Add Member</h3>
            <input 
              type="text" placeholder="Name" required
              value={newMemberName} onChange={e => setNewMemberName(e.target.value)}
              className="w-full bg-background border border-surfaceHover rounded-lg px-4 py-2"
            />
            <input 
              type="text" placeholder="Stellar Address" required
              value={newMemberAddress} onChange={e => setNewMemberAddress(e.target.value)}
              className="w-full bg-background border border-surfaceHover rounded-lg px-4 py-2"
            />
            <input 
              type="number" placeholder="Units Ordered" required min="0"
              value={newMemberAmount} onChange={e => setNewMemberAmount(parseInt(e.target.value)||0)}
              className="w-full bg-background border border-surfaceHover rounded-lg px-4 py-2"
            />
            <button type="submit" className="w-full bg-surfaceHover hover:bg-surface text-textMain font-medium py-2 rounded-lg transition-colors border border-surfaceHover">
              Add Member
            </button>
          </form>
        </div>

        {/* Expenses Section */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2 text-xl font-bold">
            <DollarSign className="text-primary" />
            <h2>Expenses</h2>
          </div>

          <div className="bg-surface rounded-xl border border-surfaceHover overflow-hidden">
            {group.expenses.length === 0 ? (
              <div className="p-6 text-center text-textMuted">No expenses logged.</div>
            ) : (
              <ul className="divide-y divide-surfaceHover">
                {group.expenses.map(e => (
                  <li key={e.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold">{e.description}</p>
                      <p className="text-xs text-textMuted">{e.isFixed ? 'Fixed (Split evenly)' : 'Variable (Split by units)'}</p>
                    </div>
                    <div className="font-medium text-red-400">
                      ${e.amount.toFixed(2)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={handleAddExpense} className="bg-surface p-6 rounded-xl border border-surfaceHover space-y-4">
            <h3 className="font-bold">Add Expense</h3>
            <input 
              type="text" placeholder="Description (e.g. Freight Shipping)" required
              value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)}
              className="w-full bg-background border border-surfaceHover rounded-lg px-4 py-2"
            />
            <div className="flex space-x-4">
              <input 
                type="number" placeholder="Amount ($)" required min="0" step="0.01"
                value={expenseAmt} onChange={e => setExpenseAmt(parseFloat(e.target.value)||0)}
                className="w-full bg-background border border-surfaceHover rounded-lg px-4 py-2"
              />
              <select 
                value={expenseType} onChange={e => setExpenseType(e.target.value as any)}
                className="bg-background border border-surfaceHover rounded-lg px-4 py-2"
              >
                <option value="fixed">Fixed</option>
                <option value="variable">Variable</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-surfaceHover hover:bg-surface text-textMain font-medium py-2 rounded-lg transition-colors border border-surfaceHover">
              Add Expense
            </button>
          </form>
        </div>
      </div>

      {/* Settlements */}
      {settlements.length > 0 && (
        <div className="space-y-6 pt-8 border-t border-surfaceHover">
          <div className="flex items-center space-x-2 text-xl font-bold">
            <Calculator className="text-primary" />
            <h2>Settlements</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {settlements.map((s, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={s.memberId} 
                className={`bg-surface p-6 rounded-xl border ${s.hasPaid ? 'border-green-500/30' : 'border-surfaceHover'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold">{s.memberName}</h3>
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

                <div className="flex justify-between items-center pt-4 border-t border-surfaceHover">
                  <span className="font-bold text-lg">Total:</span>
                  <span className="font-bold text-lg">${s.totalOwed.toFixed(2)}</span>
                </div>

                {!s.hasPaid && address === s.address && (
                  <button 
                    onClick={() => handlePay(s.memberId, s.totalOwed)}
                    className="mt-4 w-full bg-primary hover:bg-primaryHover text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    Pay Lead Buyer
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetails;
