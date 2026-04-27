import type { AdminOrdersResponse } from '@/store/api/adminOrdersApi'
import type { AdminPaymentsOverviewResponse } from '@/store/api/adminPaymentsApi'
import type { ExpensesSummaryResponse } from '@/store/api/expensesApi'
import type { MembersStatsResponse } from '@/store/api/membersApi'
import type { SupplierStatsResponse } from '@/store/api/suppliersApi'

export interface StatsGridInitialData {
  ordersData?: AdminOrdersResponse | null
  membersStats?: MembersStatsResponse | null
  paymentsOverview?: AdminPaymentsOverviewResponse | null
  supplierStats?: SupplierStatsResponse | null
  currentExpenses?: ExpensesSummaryResponse | null
  lastExpenses?: ExpensesSummaryResponse | null
}
