
import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_ALLOWED_ROLES = new Set(["admin", "super_admin", "accounting", "finance_officer", "csr", "web_content"]);
const ACCOUNTING_ALLOWED_PREFIXES = ["/admin/accounting", "/admin/encashment"];
const FINANCE_ALLOWED_PREFIXES = ["/admin/finance", "/admin/encashment"];

const getAdminRedirectPath = (role: string): string => {
    switch (role) {
        case "accounting":
            return "/admin/accounting";
        case "finance_officer":
            return "/admin/finance";
        case "csr":
            return "/admin/orders";
        case "web_content":
            return "/admin/webpages/home";
        case "admin":
        case "super_admin":
        default:
            return "/admin/dashboard";
    }
};

export async function middleware(req: NextRequest) {
    const { pathname} = req.nextUrl;
    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const isAdminLoginPage = pathname === "/admin/login";
    const isAdminRoute = pathname.startsWith("/admin");

    if (isAdminLoginPage) {
        const role = String((token as { role?: string } | null)?.role ?? "").toLowerCase();
        const userLevelId = Number((token as { userLevelId?: number } | null)?.userLevelId ?? 0);
        const isAccounting = role === "accounting" || userLevelId === 5;
        const isFinanceOfficer = role === "finance_officer" || userLevelId === 6;
        const hasAdminAccess = ADMIN_ALLOWED_ROLES.has(role) || isAccounting || isFinanceOfficer;
        if (token && hasAdminAccess) {
            const redirectPath = isAccounting ? "/admin/accounting" : isFinanceOfficer ? "/admin/finance" : getAdminRedirectPath(role);
            return NextResponse.redirect(new URL(redirectPath, req.url));
        }
        return NextResponse.next();
    }

    if (isAdminRoute) {
        if(!token) {
            const loginUrl = new URL("/admin/login", req.url);
            loginUrl.searchParams.set("callback", pathname);
            return NextResponse.redirect(loginUrl);
        }

        const role = String((token as { role?: string } | null)?.role ?? "").toLowerCase();
        const userLevelId = Number((token as { userLevelId?: number } | null)?.userLevelId ?? 0);
        const isAccounting = role === "accounting" || userLevelId === 5;
        const isFinanceOfficer = role === "finance_officer" || userLevelId === 6;
        const hasAdminAccess = ADMIN_ALLOWED_ROLES.has(role) || isAccounting || isFinanceOfficer;
        if (!hasAdminAccess) {
            return NextResponse.redirect(new URL("/", req.url));
        }

        // Accounting has a dedicated, restricted admin workspace.
        if (isAccounting) {
            const allowed = ACCOUNTING_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
            if (!allowed) {
                return NextResponse.redirect(new URL("/admin/accounting", req.url));
            }
        }

        if (isFinanceOfficer) {
            const allowed = FINANCE_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
            if (!allowed) {
                return NextResponse.redirect(new URL("/admin/finance", req.url));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
}
