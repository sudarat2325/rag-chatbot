'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, Plus, TrendingUp, TrendingDown, History } from 'lucide-react';

interface WalletData {
  id: string;
  balance: number;
  currency: string;
  transactions: WalletTransaction[];
}

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

export function WalletCard({ userId }: { userId: string }) {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');

  useEffect(() => {
    fetchWallet();
  }, [userId]);

  const fetchWallet = async () => {
    try {
      const response = await fetch(`/api/wallet?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setWallet(data.data);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('กรุณาระบุจำนวนเงินที่ถูกต้อง');
      return;
    }

    try {
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount,
          gatewayProvider: 'demo',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setWallet(data.data.wallet);
        setTopUpAmount('');
        setShowTopUp(false);
        alert('เติมเงินสำเร็จ!');
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (error) {
      console.error('Error topping up:', error);
      alert('ไม่สามารถเติมเงินได้');
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 animate-pulse">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
      {/* Header - Wallet Balance */}
      <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-90">FoodHub Wallet</p>
              <p className="text-xs opacity-75">ยอดคงเหลือ</p>
            </div>
          </div>
          <button
            onClick={() => setShowTopUp(!showTopUp)}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="text-4xl font-bold mb-2">
          ฿{wallet?.balance.toFixed(2) || '0.00'}
        </div>
      </div>

      {/* Top Up Form */}
      {showTopUp && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">เติมเงิน</h3>
          <div className="flex gap-2">
            <input
              type="number"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              placeholder="จำนวนเงิน"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <button
              onClick={handleTopUp}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              เติมเงิน
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            {[100, 200, 500, 1000].map((amount) => (
              <button
                key={amount}
                onClick={() => setTopUpAmount(amount.toString())}
                className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                ฿{amount}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5" />
            ธุรกรรมล่าสุด
          </h3>
        </div>

        <div className="space-y-3">
          {wallet?.transactions && wallet.transactions.length > 0 ? (
            wallet.transactions.slice(0, 5).map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      txn.amount > 0
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}
                  >
                    {txn.amount > 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {txn.type === 'TOP_UP' && 'เติมเงิน'}
                      {txn.type === 'PAYMENT' && 'ชำระเงิน'}
                      {txn.type === 'REFUND' && 'คืนเงิน'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(txn.createdAt).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      txn.amount > 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {txn.amount > 0 ? '+' : ''}฿{Math.abs(txn.amount).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ยอดคงเหลือ ฿{txn.balanceAfter.toFixed(2)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              ยังไม่มีธุรกรรม
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
