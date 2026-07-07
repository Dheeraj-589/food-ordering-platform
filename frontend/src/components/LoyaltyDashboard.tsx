'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Ticket, Star, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import api from '@/lib/api';

interface RewardCoupon {
  id: string;
  code: string;
  pointsCost: number;
  discount: number;
  desc: string;
}

export default function LoyaltyDashboard() {
  const { user, setAuth } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  if (!user) return null;

  const points = user.loyaltyPoints || 0;
  const level = user.rewardLevel || 'Bronze';

  // Level thresholds
  const levelMinMax: Record<string, { min: number; max: number; color: string; next: string }> = {
    Bronze: {
      min: 0,
      max: 150,
      color: 'text-amber-700 bg-amber-950/20 border-amber-900/60',
      next: 'Silver',
    },
    Silver: {
      min: 151,
      max: 500,
      color: 'text-slate-400 bg-slate-950/20 border-slate-900/60',
      next: 'Gold',
    },
    Gold: {
      min: 501,
      max: 1000,
      color: 'text-amber-500 bg-amber-950/20 border-amber-900/60',
      next: 'Platinum',
    },
    Platinum: {
      min: 1001,
      max: 5000,
      color: 'text-cyan-400 bg-cyan-950/20 border-cyan-900/60',
      next: 'None',
    },
  };

  const currentTier = levelMinMax[level] || levelMinMax.Bronze;
  const progressPercent = Math.min(
    100,
    Math.round(((points - currentTier.min) / (currentTier.max - currentTier.min)) * 100),
  );

  // Achievements
  const achievements = [
    { name: 'Loyal Fan', desc: 'Registered your account.', unlocked: true, icon: '🎉' },
    { name: 'First Bite', desc: 'Placed your first order.', unlocked: points > 100, icon: '🍕' },
    {
      name: 'Points Gatherer',
      desc: 'Earned 300 Pizza Points.',
      unlocked: points >= 300,
      icon: '💎',
    },
    {
      name: 'Local Resident',
      desc: 'Saved 2 or more addresses.',
      unlocked: user.addresses ? JSON.parse(user.addresses).length >= 2 : false,
      icon: '📍',
    },
  ];

  // Coupons available for redemption
  const rewardsList: RewardCoupon[] = [
    {
      id: 'r50',
      code: 'REDEEM50',
      pointsCost: 50,
      discount: 50,
      desc: '₹50 discount code with no minimum spend',
    },
    {
      id: 'r100',
      code: 'REDEEM100',
      pointsCost: 100,
      discount: 100,
      desc: '₹100 discount code with no minimum spend',
    },
    {
      id: 'r150',
      code: 'REDEEMSIDE',
      pointsCost: 150,
      discount: 150,
      desc: '₹150 off sides and dips combo coupon',
    },
  ];

  const handleRedeem = async (reward: RewardCoupon) => {
    if (points < reward.pointsCost) {
      addToast('Insufficient Pizza Points for this reward.', 'error');
      return;
    }

    setRedeemingId(reward.id);
    try {
      const remainingPoints = points - reward.pointsCost;
      let newLevel = level;
      if (remainingPoints <= 150) newLevel = 'Bronze';
      else if (remainingPoints <= 500) newLevel = 'Silver';
      else if (remainingPoints <= 1000) newLevel = 'Gold';
      else newLevel = 'Platinum';

      // 1. Update points on backend
      await api.patch('/users/loyalty', {
        points: remainingPoints,
        rewardLevel: newLevel,
      });

      // 2. Inject a new notification regarding coupon redemption
      const notificationsList = user.notifications ? JSON.parse(user.notifications) : [];
      const newNotif = {
        id: Math.random().toString(36).substring(2, 9),
        title: 'Coupon Unlocked! 🎟️',
        content: `Spent ${reward.pointsCost} points to redeem code ${reward.code} (${reward.desc}). Use this coupon code at checkout!`,
        type: 'coupon',
        read: false,
        createdAt: new Date().toISOString(),
      };

      const updatedNotifs = [newNotif, ...notificationsList];
      const resNotif = await api.patch('/users/notifications', {
        notifications: updatedNotifs,
      });

      // Update auth state (taking the final user model from the last update)
      const token = localStorage.getItem('auth_token') || '';
      const refreshToken = localStorage.getItem('auth_refresh_token') || '';
      setAuth(resNotif.data, token, refreshToken);

      addToast(`Redeemed coupon ${reward.code}! Added to your notifications list.`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Redemption failed. Please try again.', 'error');
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Level and points progress */}
      <div className="col-span-1 md:col-span-2 p-6 rounded-3xl bg-neutral-900/20 border border-neutral-900/60 shadow-lg space-y-6 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-neutral-300 border-b border-neutral-900 pb-3 flex items-center gap-2">
            <Award className="h-5 w-5 text-red-500" /> Pizza Points & Tiers
          </h3>

          <div className="mt-4 flex justify-between items-center">
            <div>
              <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider block">
                Membership tier
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-sm font-extrabold uppercase mt-1 border ${currentTier.color}`}
              >
                <Sparkles className="h-4 w-4" /> {level} Tier
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider block">
                Available points
              </span>
              <span className="text-2xl font-black text-red-500 mt-0.5 block">{points} pts</span>
            </div>
          </div>

          {currentTier.next !== 'None' ? (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-[11px] font-bold text-neutral-500 uppercase">
                <span>Tier progress: {progressPercent}%</span>
                <span>
                  {currentTier.max - points} pts to {currentTier.next}
                </span>
              </div>
              <div className="h-3 w-full bg-neutral-950 border border-neutral-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-500 font-semibold mt-6 uppercase tracking-wider flex items-center gap-1">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500 animate-spin" /> Maximum
              Loyalty Tier Unlocked!
            </p>
          )}
        </div>

        <p className="text-[10px] text-neutral-500 leading-relaxed font-semibold pt-4 border-t border-neutral-900/60 mt-4">
          Order pizza products to collect Pizza Points! Every ₹10 spent earns 1 Pizza Point. Points
          can be spent below to unlock discount coupons.
        </p>
      </div>

      {/* Badges and achievements */}
      <div className="p-6 rounded-3xl bg-neutral-900/20 border border-neutral-900/60 shadow-lg space-y-4">
        <h3 className="text-base font-bold text-neutral-300 border-b border-neutral-900 pb-3 flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" /> Achievements
        </h3>

        <div className="space-y-3.5 max-h-[180px] overflow-y-auto pr-1">
          {achievements.map((badge) => (
            <div
              key={badge.name}
              className={`flex items-start gap-3 p-2 rounded-xl transition-all ${
                badge.unlocked
                  ? 'opacity-100 bg-neutral-950/20 border border-neutral-900/50'
                  : 'opacity-40'
              }`}
            >
              <span className="text-xl">{badge.icon}</span>
              <div>
                <h4 className="text-xs font-bold text-neutral-200">{badge.name}</h4>
                <p className="text-[10px] text-neutral-500 mt-0.5 leading-snug">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rewards Store */}
      <div className="col-span-1 md:col-span-3 p-6 rounded-3xl bg-neutral-900/20 border border-neutral-900/60 shadow-lg space-y-4">
        <h3 className="text-base font-bold text-neutral-300 border-b border-neutral-900 pb-3 flex items-center gap-2">
          <Ticket className="h-5 w-5 text-red-500" /> Redeem Points for Coupons
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {rewardsList.map((reward) => {
            const canRedeem = points >= reward.pointsCost;
            return (
              <div
                key={reward.id}
                className="p-4 rounded-2xl bg-neutral-950 border border-neutral-900 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                      Discount
                    </span>
                    <span className="text-xs font-black text-amber-500">
                      {reward.pointsCost} points
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-neutral-200 mt-2">
                    ₹{reward.discount} Coupon
                  </h4>
                  <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">{reward.desc}</p>
                </div>

                <button
                  onClick={() => handleRedeem(reward)}
                  disabled={!canRedeem || redeemingId === reward.id}
                  className={`w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    canRedeem
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                      : 'bg-neutral-900 text-neutral-600 border border-neutral-900 cursor-not-allowed'
                  }`}
                >
                  {redeemingId === reward.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    `Redeem for ${reward.pointsCost} pts`
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
