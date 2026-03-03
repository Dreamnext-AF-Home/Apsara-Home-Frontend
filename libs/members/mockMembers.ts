import { Member } from '@/types/members/types';

export const MOCK_MEMBERS: Member[] = [
  { id: 1, name: 'Rafael Cruz', email: 'rafael@afhome.com', status: 'active', tier: 'Lifestyle Consultant', orders: 31, totalSpent: 154200, earnings: 12450, referrals: 19, joinedAt: '2025-01-12', lastActiveAt: '2026-02-22' },
  { id: 2, name: 'Lara Santos', email: 'lara@afhome.com', status: 'pending', tier: 'Home Builder', orders: 9, totalSpent: 36200, earnings: 2100, referrals: 4, joinedAt: '2025-09-21', lastActiveAt: '2026-02-19' },
  { id: 3, name: 'Miguel Ramos', email: 'miguel@afhome.com', status: 'blocked', tier: 'Home Starter', orders: 2, totalSpent: 4800, earnings: 0, referrals: 0, joinedAt: '2026-01-07', lastActiveAt: '2026-01-18' },
  { id: 4, name: 'Dana Villanueva', email: 'dana@afhome.com', status: 'active', tier: 'Lifestyle Elite', orders: 56, totalSpent: 321900, earnings: 22500, referrals: 37, joinedAt: '2024-11-03', lastActiveAt: '2026-02-23' },
  { id: 5, name: 'John Ortega', email: 'john@afhome.com', status: 'kyc_review', tier: 'Home Stylist', orders: 14, totalSpent: 71900, earnings: 4200, referrals: 8, joinedAt: '2025-06-10', lastActiveAt: '2026-02-21' },
  { id: 6, name: 'Nina Lopez', email: 'nina@afhome.com', status: 'active', tier: 'Lifestyle Consultant', orders: 27, totalSpent: 139300, earnings: 10900, referrals: 14, joinedAt: '2025-02-28', lastActiveAt: '2026-02-23' },
];
