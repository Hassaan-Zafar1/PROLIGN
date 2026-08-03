import React, { useState, useEffect } from 'react';
import api from '../config/api';

const MentorWallet = ({ navigateTo }) => {
  const [wallet, setWallet] = useState(null);
  const [cashouts, setCashouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentDetails, setPaymentDetails] = useState('');

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/wallet/me');
      setWallet(response.data.wallet);
      setCashouts(response.data.lastCashouts || []);
    } catch (err) {
      console.error('Failed to fetch wallet data:', err);
      setError(err.response?.data?.message || 'Failed to load wallet data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleSubmitCashout = async (e) => {
    e.preventDefault();
    if (!amount || !paymentMethod || !paymentDetails) {
      setError('Please fill in all cashout fields.');
      return;
    }

    const cashoutAmount = Number(amount);
    if (isNaN(cashoutAmount) || cashoutAmount < 100) {
      setError('Minimum cashout amount is $100.');
      return;
    }

    if (cashoutAmount > wallet.availableBalance) {
      setError('Amount exceeds your available balance.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      await api.post('/cashout/request', {
        amount: cashoutAmount,
        paymentMethod,
        paymentDetails,
      });
      setSuccess('Cashout request submitted successfully.');
      setAmount('');
      setPaymentDetails('');
      // Refresh wallet and list
      await fetchWalletData();
    } catch (err) {
      console.error('Failed to submit cashout request:', err);
      setError(err.response?.data?.message || 'Failed to submit cashout request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
          <p className="text-sm text-on-surface-variant font-medium">Loading wallet details...</p>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-lowest p-12 text-center max-w-lg mx-auto">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant/40 mb-4">account_balance_wallet</span>
        <h3 className="text-xl font-bold text-on-surface mb-2">No Wallet Available</h3>
        <p className="text-sm text-on-surface-variant mb-6">We could not retrieve or initialize your wallet. Please contact support.</p>
        <button onClick={fetchWalletData} className="rounded-xl bg-primary px-6 py-3 font-bold text-on-primary shadow-sm hover:shadow-md transition-all">Retry</button>
      </div>
    );
  }

  const methodLabels = {
    bank_transfer: 'Bank Transfer',
    jazzcash: 'JazzCash',
    easypaisa: 'EasyPaisa',
    paypal: 'PayPal',
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-secondary/10 text-secondary border border-secondary/20';
      case 'rejected':
        return 'bg-error/10 text-error border border-error/20';
      default:
        return 'bg-warning/10 text-warning border border-warning/20';
    }
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s]">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Balance (Green) */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/10 bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 p-6 dark:from-emerald-950/20 dark:to-emerald-900/10 natural-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Available Balance</p>
              <h3 className="mt-2 text-3xl font-extrabold text-emerald-950 dark:text-emerald-100">${wallet.availableBalance.toFixed(2)}</h3>
              <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-400/80">Cleared and ready to cashout</p>
            </div>
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-3xl bg-emerald-500/10 p-2.5 rounded-xl">account_balance_wallet</span>
          </div>
        </div>

        {/* Pending Balance (Yellow) */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/10 bg-gradient-to-br from-amber-50/50 to-amber-100/30 p-6 dark:from-amber-950/20 dark:to-amber-900/10 natural-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Pending Balance</p>
              <h3 className="mt-2 text-3xl font-extrabold text-amber-950 dark:text-amber-100">${wallet.pendingBalance.toFixed(2)}</h3>
              <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-400/80">In 48-hour dispute window</p>
            </div>
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-3xl bg-amber-500/10 p-2.5 rounded-xl">pending_actions</span>
          </div>
        </div>

        {/* Total Earned (Neutral) */}
        <div className="relative overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6 natural-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Earned</p>
              <h3 className="mt-2 text-3xl font-extrabold text-on-surface">${wallet.totalEarned.toFixed(2)}</h3>
              <p className="mt-1 text-xs text-on-surface-variant/80">Lifetime earnings cut</p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-3xl bg-on-surface-variant/10 p-2.5 rounded-xl">monetization_on</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Cashout Form + History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cashout Request Form */}
        {wallet.availableBalance >= 100 ? (
          <div className="lg:col-span-5 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 natural-shadow h-fit">
            <h3 className="text-lg font-bold text-on-surface mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">send_to_mobile</span>
              Request Cashout
            </h3>
            <p className="text-xs text-on-surface-variant mb-6">Transfer available funds to your account. Minimum $100.</p>

            {error && (
              <div className="mb-4 rounded-lg bg-error/10 border border-error/20 p-3 text-xs font-bold text-error flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-lg bg-secondary/10 border border-secondary/20 p-3 text-xs font-bold text-secondary flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmitCashout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">Amount ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-sm font-bold text-on-surface-variant">$</span>
                  <input
                    type="number"
                    min="100"
                    max={wallet.availableBalance}
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100.00"
                    className="w-full rounded-xl border border-outline bg-surface pl-8 pr-4 py-3 text-sm text-on-surface outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-all font-semibold"
                  />
                </div>
                <span className="mt-1 block text-[10px] text-on-surface-variant font-medium">Max: ${wallet.availableBalance.toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">Payment Method</label>
                <select
                  required
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-xl border border-outline bg-surface px-4 py-3 text-sm text-on-surface outline-none focus:border-secondary transition-all font-semibold"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="jazzcash">JazzCash</option>
                  <option value="easypaisa">EasyPaisa</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">Account Details</label>
                <textarea
                  required
                  rows="3"
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  placeholder={paymentMethod === 'paypal' ? 'Enter PayPal email address' : 'Enter bank name, account title, and IBAN/number'}
                  className="w-full rounded-xl border border-outline bg-surface px-4 py-3 text-sm text-on-surface outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-all font-semibold resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-on-primary hover:bg-primary/95 hover:shadow-md disabled:bg-primary/50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">payments</span>
                    Submit Cashout Request
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-5 rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low p-6 text-center h-fit">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-2">lock</span>
            <h4 className="text-sm font-bold text-on-surface">Cashout Locked</h4>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              You must have an available balance of at least <strong>$100.00</strong> to request a cashout. Keep conducting sessions to hit the clearance limit!
            </p>
          </div>
        )}

        {/* Cashout History Table */}
        <div className="lg:col-span-7 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 natural-shadow overflow-hidden">
          <h3 className="text-lg font-bold text-on-surface mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span>
            Cashout History
          </h3>
          <p className="text-xs text-on-surface-variant mb-6">Recent payout requests and statuses.</p>

          {cashouts.length > 0 ? (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/10 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Method</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Admin Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {cashouts.map((req) => (
                    <tr key={req._id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-6 py-4 text-xs text-on-surface-variant font-medium">
                        {new Date(req.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 font-bold text-on-surface">${req.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-on-surface-variant">
                        {methodLabels[req.paymentMethod] || req.paymentMethod}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${getStatusBadgeClass(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant max-w-[150px] truncate" title={req.adminNote}>
                        {req.adminNote || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-outline-variant/15 rounded-2xl bg-surface-container-low/20">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mb-2">history_toggle_off</span>
              <p className="text-xs text-on-surface-variant font-semibold">No Cashout History</p>
              <p className="text-[10px] text-on-surface-variant/70 mt-1">Your payout requests will appear here once submitted.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorWallet;
export { MentorWallet };
