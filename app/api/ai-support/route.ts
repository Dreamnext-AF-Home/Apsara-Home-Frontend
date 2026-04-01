import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";

const normalizeBase = (value?: string | null) =>
  String(value ?? "").replace(/\/+$/, "");

const parsePayload = async (
  request: Request,
): Promise<{ message: string; images: string[] }> => {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData();
    const message = String(form.get("message") ?? "");
    const images = form.getAll("images[]").map((value) => String(value));
    const legacyImage = String(form.get("image") ?? "").trim();
    if (legacyImage) images.push(legacyImage);
    return { message, images };
  }
  if (contentType.includes("application/json")) {
    const json = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const message = String(json.message ?? "");
    const images =
      Array.isArray(json.images) ? json.images.map((value) => String(value)) : [];
    return { message, images };
  }
  const text = await request.text().catch(() => "");
  if (!text) return { message: "", images: [] };
  if (text.includes("=")) {
    const params = new URLSearchParams(text);
    const message = params.get("message") ?? "";
    const images = params.getAll("images[]");
    const legacyImage = params.get("image") ?? "";
    if (legacyImage) images.push(legacyImage);
    return { message, images };
  }
  return { message: text, images: [] };
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

  const { message, images } = await parsePayload(request);

  try {
    const res = await fetch(`${apiBase}/api/ai-support`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-AF-IS-MEMBER": isMember ? "1" : "0",
      },
      body: JSON.stringify({
        message: String(message ?? "").trim(),
        images: Array.isArray(images) ? images : [],
      }),
    });

    const contentType = res.headers.get("content-type") ?? "application/json";
    const payload = await res.text();

    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { status: "error", message: "AI support returned an unexpected response." },
        { status: 502 }
      );
    }

    return new NextResponse(payload, {
      status: res.status,
      headers: { "Content-Type": contentType },
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: "AI support service is unreachable right now." },
      { status: 502 }
    );
  }
}

