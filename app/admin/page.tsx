import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { buildPageMetadata } from '@/app/seo';
import { adminAuthOptions } from "@/libs/adminAuth";

export const metadata = buildPageMetadata({ title: 'Admin', description: 'Browse the Admin page on AF Home.', path: '/admin', noIndex: true });

export default async function AdminIndexPage() {
  const session = await getServerSession(adminAuthOptions);
  const userLevelId = session?.user?.userLevelId;

  if (!session?.user) {
    redirect("/admin/login");
  }

  if (userLevelId === 4) {
    redirect("/admin/webpages");
  }

  redirect("/admin/dashboard");
}
