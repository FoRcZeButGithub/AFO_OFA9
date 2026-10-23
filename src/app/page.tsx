'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { HeroBanner } from '@/components/HeroBanner';
import { AiPlannerTab } from '@/components/AiPlannerTab';
import { CommunityEscrowTab } from '@/components/CommunityEscrowTab';
import { TrustReviewTab } from '@/components/TrustReviewTab';
import { JudgeRevenueDashboardTab } from '@/components/JudgeRevenueDashboardTab';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import {
  SubscriptionTier,
  UserProfile,
  CommunityTrip,
  UserReview,
  EscrowTransaction,
  RevenueMetrics,
  TripParticipant,
  OtaComparison,
  TIER_CONFIGS,
} from '@/lib/types';
import {
  INITIAL_USER,
  MOCK_USERS,
  HERO_COMMUNITY_TRIP,
  ADDITIONAL_COMMUNITY_TRIPS,
  MOCK_REVIEWS,
  INITIAL_TRANSACTIONS,
  INITIAL_REVENUE_METRICS,
} from '@/lib/mockData';

export default function HomePage() {
  // Navigation & Modal State
  const [activeTab, setActiveTab] = useState<string>('ai-planner');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);

  // User State
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USER);
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('FREE');
  const [aiQuotaUsed, setAiQuotaUsed] = useState<number>(0);

  // Data States
  const [usersList, setUsersList] = useState<UserProfile[]>(MOCK_USERS);
  const [heroTrip, setHeroTrip] = useState<CommunityTrip>(HERO_COMMUNITY_TRIP);
  const [allCommunityTrips, setAllCommunityTrips] = useState<CommunityTrip[]>(ADDITIONAL_COMMUNITY_TRIPS);
  const [reviewsList, setReviewsList] = useState<UserReview[]>(MOCK_REVIEWS);
  const [transactionsList, setTransactionsList] = useState<EscrowTransaction[]>(INITIAL_TRANSACTIONS);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics>(INITIAL_REVENUE_METRICS);

  // Load / Sync state from localStorage for persistent demo session
  useEffect(() => {
    try {
      const savedTier = localStorage.getItem('tripsure_tier') as SubscriptionTier;
      if (savedTier && savedTier in TIER_CONFIGS) {
        setCurrentTier(savedTier);
      }
      const savedQuota = localStorage.getItem('tripsure_quota');
      if (savedQuota) {
        setAiQuotaUsed(parseInt(savedQuota) || 0);
      }
    } catch (e) {
      // Ignore if localStorage unavailable
    }
  }, []);

  const handleTierChange = (newTier: SubscriptionTier) => {
    setCurrentTier(newTier);
    try {
      localStorage.setItem('tripsure_tier', newTier);
    } catch (e) {}

    // Record subscription revenue transaction if upgrading from FREE
    const tierConfig = TIER_CONFIGS[newTier];
    if (tierConfig.priceMonthly > 0) {
      const upgradeTx: EscrowTransaction = {
        id: `tx_sub_${Date.now()}`,
        userName: currentUser.fullName,
        type: 'SUBSCRIPTION_UPGRADE',
        amount: tierConfig.priceMonthly,
        platformRevenue: tierConfig.priceMonthly,
        description: `อัปเกรดสมาชิกเป็น ${tierConfig.labelThai} (โควตา AI ${tierConfig.maxQuotas} ครั้ง/เดือน)`,
        timestamp: 'เพิ่งเกิดขึ้น',
      };

      setTransactionsList((prev) => [upgradeTx, ...prev]);
      setRevenueMetrics((prev) => ({
        ...prev,
        totalRevenue: prev.totalRevenue + tierConfig.priceMonthly,
        subscriptionRevenue: prev.subscriptionRevenue + tierConfig.priceMonthly,
        activeTransactionsCount: prev.activeTransactionsCount + 1,
      }));
    }
  };

  const handleQuotaIncrement = () => {
    const nextQuota = aiQuotaUsed + 1;
    setAiQuotaUsed(nextQuota);
    try {
      localStorage.setItem('tripsure_quota', nextQuota.toString());
    } catch (e) {}
  };

  // 1. Join Trip & Hold Deposit in Escrow
  const handleJoinTrip = (trip: CommunityTrip) => {
    if (trip.joinedSlots >= trip.totalSlots) return;

    const newJoinedCount = trip.joinedSlots + 1;
    const newPool = trip.tripPoolBalance + trip.securityDepositPerPerson;

    const newParticipant: TripParticipant = {
      id: `p_${Date.now()}`,
      userId: currentUser.id,
      fullName: currentUser.fullName,
      avatarUrl: currentUser.avatarUrl,
      depositPaid: trip.securityDepositPerPerson,
      escrowStatus: 'HELD',
      trustScore: currentUser.trustScore,
      attendanceRate: currentUser.attendanceRate,
      joinedAt: 'เพิ่งเข้าร่วม',
    };

    const updatedHero = {
      ...heroTrip,
      joinedSlots: newJoinedCount,
      tripPoolBalance: newPool,
      participants: [...heroTrip.participants, newParticipant],
    };

    setHeroTrip(updatedHero);

    const depositTx: EscrowTransaction = {
      id: `tx_dep_${Date.now()}`,
      tripId: trip.id,
      userName: currentUser.fullName,
      type: 'DEPOSIT_ESCROW',
      amount: trip.securityDepositPerPerson,
      platformRevenue: 0,
      description: `วางเงินค้ำประกัน Escrow ฿${trip.securityDepositPerPerson.toLocaleString()} ทริป "${trip.title}"`,
      timestamp: 'เพิ่งเกิดขึ้น',
    };

    setTransactionsList((prev) => [depositTx, ...prev]);
  };

  // 2. Simulate Member Cancellation (10% Penalty Tax Split)
  const handleSimulateFlake = (trip: CommunityTrip, participant: TripParticipant) => {
    const deposit = participant.depositPaid;
    const totalPenalty = Math.round(deposit * 0.10); // 150 THB
    const platformShare = Math.round(totalPenalty * 0.50); // 75 THB (5%)
    const poolSubsidies = Math.round(totalPenalty * 0.50); // 75 THB (5%)
    const remainingCount = Math.max(1, trip.joinedSlots - 1);
    const subsidyPerMember = Math.round(poolSubsidies / remainingCount);

    // Update participant status & warning tags
    const updatedParticipants = trip.participants.map((p) => {
      if (p.id === participant.id) {
        return {
          ...p,
          escrowStatus: 'PENALIZED_CANCEL' as const,
          attendanceRate: Math.max(0, p.attendanceRate - 15),
          trustScore: Math.max(0, p.trustScore - 12),
          warningNote: '⚠️ เคยเททริปกระทันหัน (ถูกหักเงินมัดจำ 10% ตามสัญญา Escrow)',
        };
      }
      return p;
    });

    // Update flaker profile in directory
    setUsersList((prev) =>
      prev.map((u) => {
        if (u.id === participant.userId || u.fullName.includes(participant.fullName.split(' ')[0])) {
          return {
            ...u,
            trustScore: Math.max(0, u.trustScore - 12),
            attendanceRate: Math.max(0, u.attendanceRate - 15),
            tripsCancelled: u.tripsCancelled + 1,
            warningTags: [
              '⚠️ เคยยกเลิกกระทันหัน 1 ครั้ง (โดนหัก 10%)',
              ...u.warningTags.filter((t) => !t.includes('เคยยกเลิก')),
            ],
          };
        }
        return u;
      })
    );

    // Update Hero Trip Pool & Participants
    setHeroTrip({
      ...heroTrip,
      participants: updatedParticipants,
      tripPoolBalance: heroTrip.tripPoolBalance + poolSubsidies, // pool gets 75 THB extra compensation
    });

    // Create 2 Transactions: 5% Platform Revenue + 5% Member Subsidies
    const platTx: EscrowTransaction = {
      id: `tx_pen_plat_${Date.now()}`,
      tripId: trip.id,
      userName: participant.fullName,
      type: 'PENALTY_PLATFORM_5',
      amount: totalPenalty,
      platformRevenue: platformShare,
      description: `ภาษีค่าปรับเททริป 5% (฿${platformShare}) เข้าแพลตฟอร์มจาก ${participant.fullName}`,
      timestamp: 'เพิ่งเกิดขึ้น',
    };

    const poolTx: EscrowTransaction = {
      id: `tx_pen_pool_${Date.now()}`,
      tripId: trip.id,
      userName: participant.fullName,
      type: 'PENALTY_POOL_5',
      amount: poolSubsidies,
      platformRevenue: 0,
      poolAddition: poolSubsidies,
      description: `เงินชดเชยกองกลาง 5% (฿${poolSubsidies}) กระจายให้สมาชิกที่เหลือ ${remainingCount} คน (~฿${subsidyPerMember}/คน)`,
      timestamp: 'เพิ่งเกิดขึ้น',
    };

    setTransactionsList((prev) => [platTx, poolTx, ...prev]);

    // Update Revenue metrics
    setRevenueMetrics((prev) => ({
      ...prev,
      totalRevenue: prev.totalRevenue + platformShare,
      penaltyTaxRevenue: prev.penaltyTaxRevenue + platformShare,
      escrowPoolSubsidiesGiven: prev.escrowPoolSubsidiesGiven + poolSubsidies,
      activeTransactionsCount: prev.activeTransactionsCount + 2,
    }));
  };

  // 3. Create New Community Trip (3.5% Platform Creation Fee)
  const handleCreateNewTrip = (newTripData: Partial<CommunityTrip>) => {
    const totalTarget = (newTripData.totalSlots || 6) * (newTripData.costPerPerson || 2500);
    const tierConfig = TIER_CONFIGS[currentTier];
    const baseFee = totalTarget * 0.035;
    const discount = tierConfig.creationFeeDiscountPercent / 100;
    const finalFee = Math.round(baseFee * (1 - discount));

    const completeTrip: CommunityTrip = {
      id: `trip_${Date.now()}`,
      hostId: currentUser.id,
      host: currentUser,
      title: newTripData.title || 'ทริปพาเที่ยวพักผ่อน',
      destination: newTripData.destination || 'เกาะล้าน ชลบุรี',
      travelDates: newTripData.travelDates || '28 - 29 พ.ย. 2026',
      totalSlots: newTripData.totalSlots || 6,
      joinedSlots: 1,
      costPerPerson: newTripData.costPerPerson || 2500,
      securityDepositPerPerson: newTripData.securityDepositPerPerson || 1000,
      status: 'OPEN',
      platformCreationFeeRate: 0.035,
      cancellationPenaltyRate: 0.10,
      tripPoolBalance: newTripData.securityDepositPerPerson || 1000,
      highlights: newTripData.highlights || ['🛡️ มีสัญญา Smart Escrow ค้ำประกันมัดจำ'],
      imageUrl: newTripData.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      participants: [
        {
          id: `p_host_${Date.now()}`,
          userId: currentUser.id,
          fullName: `${currentUser.fullName} (Host)`,
          avatarUrl: currentUser.avatarUrl,
          depositPaid: newTripData.securityDepositPerPerson || 1000,
          escrowStatus: 'HELD',
          trustScore: currentUser.trustScore,
          attendanceRate: currentUser.attendanceRate,
          joinedAt: 'วันนี้',
        },
      ],
    };

    setAllCommunityTrips((prev) => [completeTrip, ...prev]);

    if (finalFee > 0) {
      const creationTx: EscrowTransaction = {
        id: `tx_create_${Date.now()}`,
        tripId: completeTrip.id,
        userName: currentUser.fullName,
        type: 'CREATION_FEE_3_5',
        amount: totalTarget,
        platformRevenue: finalFee,
        description: `ค่าธรรมเนียมคุ้มครองแพลตฟอร์ม 3.5% ทริป "${completeTrip.destination}" (ส่วนลดระดับ ${currentTier} ${tierConfig.creationFeeDiscountPercent}%)`,
        timestamp: 'เพิ่งเกิดขึ้น',
      };

      setTransactionsList((prev) => [creationTx, ...prev]);
      setRevenueMetrics((prev) => ({
        ...prev,
        totalRevenue: prev.totalRevenue + finalFee,
        creationFeeRevenue: prev.creationFeeRevenue + finalFee,
        activeTransactionsCount: prev.activeTransactionsCount + 1,
      }));
    }
  };

  // 4. Record OTA Affiliate Click (4% Commission)
  const handleRecordAffiliateClick = (ota: OtaComparison) => {
    const commission = Math.round(ota.discountedPrice * (ota.affiliateCommissionRate || 0.04));

    const affTx: EscrowTransaction = {
      id: `tx_aff_${Date.now()}`,
      userName: currentUser.fullName,
      type: 'AFFILIATE_COMMISSION',
      amount: ota.discountedPrice,
      platformRevenue: commission,
      description: `รับคอมมิชชั่น Affiliate 4% (${ota.provider}) จากการจอง "${ota.name}"`,
      timestamp: 'เพิ่งเกิดขึ้น',
    };

    setTransactionsList((prev) => [affTx, ...prev]);
    setRevenueMetrics((prev) => ({
      ...prev,
      totalRevenue: prev.totalRevenue + commission,
      affiliateRevenue: prev.affiliateRevenue + commission,
      activeTransactionsCount: prev.activeTransactionsCount + 1,
    }));
  };

  // 5. Add User Review
  const handleAddReview = (newReview: UserReview) => {
    setReviewsList((prev) => [newReview, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Top Navbar */}
      <Navbar
        currentTier={currentTier}
        aiQuotaUsed={aiQuotaUsed}
        onTierChange={handleTierChange}
        onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalRevenue={revenueMetrics.totalRevenue}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        
        {/* Hero Pitch Banner */}
        <HeroBanner
          currentTier={currentTier}
          onExploreAiPlanner={() => setActiveTab('ai-planner')}
          onExploreEscrow={() => setActiveTab('community')}
        />

        {/* Tab Content Display */}
        <div className="mt-8">
          {activeTab === 'ai-planner' && (
            <AiPlannerTab
              currentTier={currentTier}
              aiQuotaUsed={aiQuotaUsed}
              onQuotaIncrement={handleQuotaIncrement}
              onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
              onRecordAffiliateClick={handleRecordAffiliateClick}
            />
          )}

          {activeTab === 'community' && (
            <CommunityEscrowTab
              currentTier={currentTier}
              heroTrip={heroTrip}
              onJoinTrip={handleJoinTrip}
              onSimulateFlake={handleSimulateFlake}
              onCreateNewTrip={handleCreateNewTrip}
              allTrips={allCommunityTrips}
              userProfile={currentUser}
            />
          )}

          {activeTab === 'trust-review' && (
            <TrustReviewTab
              users={usersList}
              reviews={reviewsList}
              onAddReview={handleAddReview}
            />
          )}

          {activeTab === 'judge-dashboard' && (
            <JudgeRevenueDashboardTab
              revenueMetrics={revenueMetrics}
              transactions={transactionsList}
              onSimulateSubscriptionUpgrade={() => handleTierChange('PLATINUM')}
              onSimulateAffiliateClick={() =>
                handleRecordAffiliateClick({
                  id: 'ota_test',
                  provider: 'Agoda',
                  category: 'HOTEL',
                  name: 'Sai Kaew Beach Resort Villa',
                  rating: 4.8,
                  originalPrice: 4500,
                  discountedPrice: 3650,
                  seasonTrend: 'ถูกกว่า High Season 19%',
                  savingsPercentage: 19,
                  isCheapest: true,
                  affiliateCommissionRate: 0.04,
                  bookingUrl: '#',
                  badges: ['Agoda ดีลพิเศษ'],
                })
              }
              onSimulateCreationFee={() =>
                handleCreateNewTrip({
                  title: 'ทริปเหมาเรือดำน้ำเกาะเต่า 4 วัน 3 คืน',
                  destination: 'เกาะเต่า สุราษฎร์ธานี',
                  totalSlots: 8,
                  costPerPerson: 3500,
                })
              }
              onSimulateCancellationPenalty={() =>
                handleSimulateFlake(heroTrip, heroTrip.participants[2] || heroTrip.participants[0])
              }
            />
          )}
        </div>

      </main>

      {/* Subscription Paywall Modal */}
      <SubscriptionModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        currentTier={currentTier}
        onSelectTier={handleTierChange}
      />

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-white py-10 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <div className="font-bold text-slate-800 text-sm mb-1">
            TripSure AI (ทริปชัวร์) — Thailand&apos;s 1st Anti-Flake Trip Escrow & AI Planner
          </div>
          <p>
            Hackathon Project &ldquo;Make Me Money&rdquo; • Built with Next.js App Router, Tailwind CSS, Google Gemini 2.5 Flash, Supabase & TMD/Open-Meteo Weather APIs
          </p>
          <div className="mt-2 text-slate-400">
            ระบบทำงานได้อย่างสมบูรณ์แบบทั้งโหมด Fallback ข้อมูลจำลองไทย และโหมดต่อ API จริง
          </div>
        </div>
      </footer>

    </div>
  );
}
