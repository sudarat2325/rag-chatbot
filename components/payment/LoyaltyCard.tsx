'use client';

import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, Gift, Crown } from 'lucide-react';

interface LoyaltyData {
  id: string;
  points: number;
  totalEarned: number;
  totalSpent: number;
  tier: string;
  transactions: PointTransaction[];
  benefits: TierBenefits;
}

interface PointTransaction {
  id: string;
  type: string;
  points: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

interface TierBenefits {
  discount: number;
  pointMultiplier: number;
  freeDelivery: boolean;
}

export function LoyaltyCard({ userId }: { userId: string }) {
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoyalty();
  }, [userId]);

  const fetchLoyalty = async () => {
    try {
      const response = await fetch(`/api/loyalty?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setLoyalty(data.data);
      }
    } catch (error) {
      console.error('Error fetching loyalty:', error);
    } finally {
      setLoading(false);
    }
  };

  const tierColors = {
    BRONZE: 'from-amber-600 to-amber-800',
    SILVER: 'from-gray-400 to-gray-600',
    GOLD: 'from-yellow-400 to-yellow-600',
    PLATINUM: 'from-cyan-400 to-blue-600',
    DIAMOND: 'from-purple-400 to-pink-600',
  };

  const tierIcons = {
    BRONZE: '🥉',
    SILVER: '🥈',
    GOLD: '🥇',
    PLATINUM: '💎',
    DIAMOND: '👑',
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
      {/* Header - Loyalty Points */}
      <div
        className={`bg-gradient-to-br ${
          tierColors[loyalty?.tier as keyof typeof tierColors] || tierColors.BRONZE
        } p-6 text-white`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
              {tierIcons[loyalty?.tier as keyof typeof tierIcons] || '🥉'}
            </div>
            <div>
              <p className="text-sm opacity-90">FoodHub Rewards</p>
              <p className="font-semibold">{loyalty?.tier} Member</p>
            </div>
          </div>
          <Crown className="w-8 h-8 opacity-50" />
        </div>

        <div className="text-4xl font-bold mb-2 flex items-baseline gap-2">
          {loyalty?.points.toLocaleString() || 0}
          <span className="text-lg opacity-75">คะแนน</span>
        </div>
      </div>

      {/* Benefits */}
      <div className="p-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Gift className="w-5 h-5 text-orange-500" />
          สิทธิประโยชน์
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-orange-500">
              {loyalty?.benefits.discount}%
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">ส่วนลด</p>
          </div>
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-orange-500">
              {loyalty?.benefits.pointMultiplier}x
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">คะแนน</p>
          </div>
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-2xl">
              {loyalty?.benefits.freeDelivery ? '✅' : '❌'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">ส่งฟรี</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">รับมาทั้งหมด</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {loyalty?.totalEarned.toLocaleString()} คะแนน
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">ใช้ไปแล้ว</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {loyalty?.totalSpent.toLocaleString()} คะแนน
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          กิจกรรมล่าสุด
        </h3>

        <div className="space-y-3">
          {loyalty?.transactions && loyalty.transactions.length > 0 ? (
            loyalty.transactions.slice(0, 5).map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      txn.points > 0
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-orange-100 dark:bg-orange-900/30'
                    }`}
                  >
                    {txn.points > 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Gift className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {txn.type === 'EARNED' && 'รับคะแนน'}
                      {txn.type === 'REDEEMED' && 'ใช้คะแนน'}
                      {txn.type === 'BONUS' && 'โบนัส'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(txn.createdAt).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      txn.points > 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-orange-600 dark:text-orange-400'
                    }`}
                  >
                    {txn.points > 0 ? '+' : ''}{txn.points} pts
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    คงเหลือ {txn.balanceAfter.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              ยังไม่มีกิจกรรม
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
