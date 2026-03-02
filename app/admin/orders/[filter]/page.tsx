import AdminOrdersPageMain from "@/components/superAdmin/orders/AdminOrdersPageMain";

interface PageProps {
  params: Promise<{ filter: string }>;
}

export default async function AdminOrdersFilterPage({ params }: PageProps) {
  const { filter } = await params;
  return <AdminOrdersPageMain initialFilter={filter} />;
}
