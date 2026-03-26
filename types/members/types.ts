export type MemberStatus = 'active' | 'pending' | 'blocked' | 'kyc_review';

export type MemberTier =
  | 'Home Starter'
  | 'Home Builder'
  | 'Home Stylist'
  | 'Lifestyle Consultant'
  | 'Lifestyle Elite';

export interface Member {
  id: number;
  name: string;
  username?: string;
  email: string;
  contactNumber?: string;
  avatar?: string;
  verificationStatus?: 'verified' | 'pending_review' | 'on_hold' | 'not_verified' | 'blocked';
  status: MemberStatus;
  tier: MemberTier;
  orders: number;
  totalSpent: number;
  earnings: number;
  walletCashBalance?: number;
  walletPvBalance?: number;
  walletCashCredits?: number;
  walletPvCredits?: number;
  referrals: number;
  joinedAt: string;
  lastActiveAt: string;
  addressLine?: string;
  barangay?: string;
  city?: string;
  province?: string;
  region?: string;
  zipCode?: string;
  fullAddress?: string;
}
