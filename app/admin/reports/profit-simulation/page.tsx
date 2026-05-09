import { buildPageMetadata } from '@/app/seo'
import ProfitSimulationMain from '@/components/superAdmin/reports/ProfitSimulationMain'

export const metadata = buildPageMetadata({
  title: 'Admin Profit Simulation',
  description: 'Simulate product PV allocations, payout pools, and estimated margin on AF Home.',
  path: '/admin/reports/profit-simulation',
  noIndex: true,
})

export default function AdminProfitSimulationPage() {
  return <ProfitSimulationMain />
}
