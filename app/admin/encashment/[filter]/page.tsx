import EncashmentPageMain from "@/components/superAdmin/encashment/EncashmentPageMain";

interface PageProps {
  params: Promise<{ filter: string }>;
}

export default async function AdminEncashmentFilterPage({ params }: PageProps) {
  const { filter } = await params;
  return <EncashmentPageMain initialFilter={filter} />;
}
