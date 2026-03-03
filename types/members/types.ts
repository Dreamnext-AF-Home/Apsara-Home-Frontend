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
  email: string;
  avatar?: string;
  status: MemberStatus;
  tier: MemberTier;
  orders: number;
  totalSpent: number;
  earnings: number;
  referrals: number;
  joinedAt: string;
  lastActiveAt: string;
}
