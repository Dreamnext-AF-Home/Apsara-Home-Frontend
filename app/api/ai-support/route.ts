import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";

const normalizeBase = (value?: string | null) =>
  String(value ?? "").replace(/\/+$/, "");

const parseMessage = async (request: Request): Promise<string> => {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData();
    return String(form.get("message") ?? "");
  }
  if (contentType.includes("application/json")) {
    const json = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return String(json.message ?? "");
  }
  const text = await request.text().catch(() => "");
  if (!text) return "";
  if (text.includes("=")) {
    const params = new URLSearchParams(text);
    return params.get("message") ?? "";
  }
  return text;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const isMember = Boolean(session?.user);

  const apiBase =
    normalizeBase(process.env.LARAVEL_API_URL) ||
    normalizeBase(process.env.NEXT_PUBLIC_LARAVEL_API_URL);

  if (!apiBase) {
    return NextResponse.json(
      { status: "error", message: "Backend API URL is not configured." },
      { status: 500 }
    );
  }

  const message = (await parseMessage(request)).trim();
  const body = `message=${encodeURIComponent(message)}`;

  const res = await fetch(`${apiBase}/api/ai-support`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-AF-IS-MEMBER": isMember ? "1" : "0",
    },
    body,
  });

  const contentType = res.headers.get("content-type") ?? "application/json";
  const payload = await res.text();

  return new NextResponse(payload, {
    status: res.status,
    headers: { "Content-Type": contentType },
  });
}

