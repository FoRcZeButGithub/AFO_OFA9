'use client';

import React from 'react';
import { Compass, Sparkles, ShieldCheck, DollarSign, Crown, Zap, ArrowUpRight } from 'lucide-react';
import { SubscriptionTier, TIER_CONFIGS } from '@/lib/types';

interface NavbarProps {
  currentTier: SubscriptionTier;
  aiQuotaUsed: number;
  onTierChange: (tier: SubscriptionTier) => void;
  onOpenUpgradeModal: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  totalRevenue: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTier,
  aiQuotaUsed,
  onTierChange,
  onOpenUpgradeModal,
  activeTab,
  setActiveTab,
  totalRevenue,
}) => {
  const tierConfig = TIER_CONFIGS[currentTier];
  const quotaRemaining = Math.max(0, tierConfig.maxQuotas - aiQuotaUsed);
  const quotaPercent = Math.min(100, Math.round((aiQuotaUsed / tierConfig.maxQuotas) * 100));

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Platform Tag */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('ai-planner')}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Compass className="w-6 h-6 animate-pulse-slow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-700 via-teal-700 to-indigo-700 bg-clip-text text-transparent">
                  TripSure AI
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ทริปชัวร์
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Thailand&apos;s 1st Anti-Flake Trip Escrow & AI Planner
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/90 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('ai-planner')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 ${
                activeTab === 'ai-planner'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>AI Planner & OTA</span>
            </button>

            <button
              onClick={() => setActiveTab('community')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 ${
                activeTab === 'community'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Community Escrow</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </button>

            <button
              onClick={() => setActiveTab('trust-review')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 ${
                activeTab === 'trust-review'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>รีวิว & ผู้ร่วมทริป</span>
            </button>

            <button
              onClick={() => setActiveTab('judge-dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'judge-dashboard'
                  ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md'
                  : 'text-amber-700 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/60'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Judge Revenue</span>
              <span className="text-xs bg-white/20 px-1.5 py-0.2 rounded-md font-mono">
                ฿{totalRevenue.toLocaleString()}
              </span>
            </button>
          </nav>

          {/* Right Controls: Tier Switcher & Live Quota Counter */}
          <div className="flex items-center space-x-3">
            
            {/* Quick Live Tier Switcher for Hackathon Judges */}
            <div className="hidden lg:flex items-center space-x-1 bg-slate-50 border border-slate-200 p-1 rounded-xl">
              <span className="text-xs font-medium text-slate-400 px-1.5">Tier:</span>
              {(['FREE', 'GOLD', 'PLATINUM'] as SubscriptionTier[]).map((tierKey) => {
                const isActive = currentTier === tierKey;
                return (
                  <button
                    key={tierKey}
                    onClick={() => onTierChange(tierKey)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      isActive
                        ? tierKey === 'PLATINUM'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : tierKey === 'GOLD'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {tierKey}
                  </button>
                );
              })}
            </div>

            {/* Quota Counter Widget */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center space-x-3">
              <div className="text-left">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span>โควตา AI:</span>
                  <span className={`font-mono font-bold ${quotaRemaining === 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {quotaRemaining}/{tierConfig.maxQuotas}
                  </span>
                </div>
                {/* Micro progress bar */}
                <div className="w-24 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      quotaPercent >= 100
                        ? 'bg-rose-500'
                        : quotaPercent >= 60
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${quotaPercent}%` }}
                  />
                </div>
              </div>

              {/* Upgrade Trigger Button */}
              <button
                onClick={onOpenUpgradeModal}
                className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1 transition-all"
                title="คลิกเพื่ออัปเกรดแพ็กเกจเพิ่มโควตา"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>อัปเกรด</span>
                <ArrowUpRight className="w-3 h-3 hidden sm:inline" />
              </button>
            </div>

          </div>

        </div>

        {/* Mobile Tab Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('ai-planner')}
            className={`px-2.5 py-1 rounded-lg ${activeTab === 'ai-planner' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600'}`}
          >
            AI Planner
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`px-2.5 py-1 rounded-lg ${activeTab === 'community' ? 'bg-indigo-100 text-indigo-800 font-bold' : 'text-slate-600'}`}
          >
            Escrow ทริป
          </button>
          <button
            onClick={() => setActiveTab('trust-review')}
            className={`px-2.5 py-1 rounded-lg ${activeTab === 'trust-review' ? 'bg-slate-200 text-slate-800 font-bold' : 'text-slate-600'}`}
          >
            รีวิวความน่าเชื่อถือ
          </button>
          <button
            onClick={() => setActiveTab('judge-dashboard')}
            className={`px-2.5 py-1 rounded-lg ${activeTab === 'judge-dashboard' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-600'}`}
          >
            📊 รายได้ ฿{totalRevenue.toLocaleString()}
          </button>
        </div>

      </div>
    </header>
  );
};
