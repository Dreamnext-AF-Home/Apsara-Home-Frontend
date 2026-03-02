
import MembersPageMain from "@/components/superAdmin/members/MembersPageMain";
import { authOptions } from "@/libs/auth";
import { MembersResponse, MembersStatsResponse } from "@/store/api/membersApi";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

async function getInitialMembers(accessToken: string): Promise<MembersResponse | null> {
  const apiUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL;
  if (!apiUrl) return null;
  
  const res = await fetch(`${apiUrl}/api/admin/members?page=1&per_page=25`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store"
  })

  if (!res.ok) return null;
  return res.json();

}

async function getInitialMemberStats(accessToken: string): Promise<MembersStatsResponse | null> {
  const apiUrl = process.env.LARAVEL_API_URL ?? process.env.NEXT_PUBLIC_LARAVEL_API_URL;
  if (!apiUrl) return null;

  const res = await fetch(`${apiUrl}/api/admin/members/stats`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

export default async function AdminMembersPage() {
  const session = await getServerSession(authOptions);
  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken;

  if (!accessToken) {
    return <MembersPageMain initialData={null} initialStats={null} />;
  }

  const [initialData, initialStats] = await Promise.all([
    getInitialMembers(accessToken),
    getInitialMemberStats(accessToken),
  ]);

  return <MembersPageMain initialData={initialData} initialStats={initialStats} />
}
