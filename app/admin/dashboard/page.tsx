'use client';

import OrdersChart from "@/components/superAdmin/dashboard/OrdersChart";
import RecentOrders from "@/components/superAdmin/dashboard/RecentOrders";
import SalesChart from "@/components/superAdmin/dashboard/SalesChart";
import StatsGrid from "@/components/superAdmin/dashboard/StatsGrid";
import TopProducts from "@/components/superAdmin/dashboard/TopProducts";

const AdminDashboardPage = () => {
  return (
    <div className="space-y-6">
      <StatsGrid />
      <div className="grid grid-cols-1 xl:grid-col-3 gap-6">
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
    </div>
  );
};

export default AdminDashboardPage;
