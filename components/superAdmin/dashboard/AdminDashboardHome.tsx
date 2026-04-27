import OrdersChart from "@/components/superAdmin/dashboard/OrdersChart";
import RecentOrders from "@/components/superAdmin/dashboard/RecentOrders";
import SalesChart from "@/components/superAdmin/dashboard/SalesChart";
import StatsGrid from "@/components/superAdmin/dashboard/StatsGrid";
import TopProducts from "@/components/superAdmin/dashboard/TopProducts";
import RecentAdminProductActivity from "@/components/superAdmin/dashboard/RecentAdminProductActivity";
import type { StatsGridInitialData } from "@/components/superAdmin/dashboard/statsGridTypes";

type AdminDashboardHomeProps = {
  initialStatsData?: StatsGridInitialData
}

export default function AdminDashboardHome({ initialStatsData }: AdminDashboardHomeProps) {
  return (
    <div className="space-y-6">
      <StatsGrid initialData={initialStatsData} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <SalesChart />
        </div>
        <div>
          <OrdersChart />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RecentOrders />
        </div>
        <div>
          <TopProducts />
        </div>
      </div>

      <RecentAdminProductActivity />
    </div>
  );
}
