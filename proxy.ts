import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { normalizeAdminPermissions } from "@/libs/adminPermissions";

const ADMIN_ALLOWED_ROLES = new Set([
  "admin",
  "super_admin",
  "accounting",
  "finance_officer",
  "csr",
  "web_content",
  "merchant_admin",
  "supplier_admin",
]);
const ACCOUNTING_ALLOWED_PREFIXES = ["/admin/accounting", "/admin/encashment"];
const FINANCE_ALLOWED_PREFIXES = [
  "/admin/finance",
  "/admin/encashment",
  "/admin/accounting/invoices",
];
const ADMIN_ALLOWED_PREFIXES = [
  "/admin/dashboard",
  "/admin/orders",
  "/admin/interior-requests",
  "/admin/products",
  "/admin/shipping",
  "/admin/webpages",
  "/admin/settings/users",
];
const ADMIN_PERMISSION_PREFIXES: Record<string, string[]> = {
  members: ["/admin/members"],
  orders: ["/admin/orders"],
  interior_requests: ["/admin/interior-requests"],
  products: ["/admin/products"],
  shipping: ["/admin/shipping"],
  suppliers: ["/admin/suppliers"],
  web_content: ["/admin/webpages"],
  settings_users: ["/admin/settings/users"],
};
const MERCHANT_ALLOWED_PREFIXES = [
  "/admin/dashboard",
  "/admin/orders",
  "/admin/products",
  "/admin/shipping",
];
const ADMIN_SUPPLIER_ALLOWED_PREFIXES = [
  "/admin/dashboard",
  "/admin/products",
  "/admin/suppliers",
];

const AUTH_REQUIRED_PREFIXES = ["/profile", "/orders"]
const SUPPLIER_ALLOWED_PREFIXES = [
  "/supplier/dashboard",
  "/supplier/products",
  "/supplier/orders",
  "/supplier/reports",
  "/supplier/categories",
  "/supplier/users",
  "/supplier/company",
];

const getAdminRedirectPath = (role: string): string => {
  switch (role) {
    case "accounting":
      return "/admin/accounting";
    case "finance_officer":
      return "/admin/finance";
    case "csr":
      return "/admin/orders";
    case "web_content":
      return "/admin/webpages";
    case "merchant_admin":
      return "/admin/orders";
    case "supplier_admin":
      return "/admin/dashboard";
    case "admin":
    case "super_admin":
    default:
      return "/admin/dashboard";
  }
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const adminToken = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: process.env.NODE_ENV === 'production'
      ? '__Secure-admin-next-auth.session-token'
      : 'admin-next-auth.session-token',
  });
  const supplierToken = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: process.env.NODE_ENV === 'production'
      ? '__Secure-supplier-next-auth.session-token'
      : 'supplier-next-auth.session-token',
  });
  const passwordChangeRequired = Boolean((token as { passwordChangeRequired?: boolean } | null)?.passwordChangeRequired);

  const isAdminLoginPage = pathname === "/admin/login";
  const isSupplierPublicPage =
    pathname === "/supplier/login" ||
    pathname === "/supplier/forgot-password" ||
    pathname === "/supplier/reset-password";
  const isAdminRoute = pathname.startsWith("/admin");
  const isSupplierRoute = pathname.startsWith("/supplier");
  const isAuthRequiredRoute = AUTH_REQUIRED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isLoginPage = pathname === "/login";

  if (isAdminLoginPage) {
    const role = String((adminToken as { role?: string } | null)?.role ?? "").toLowerCase();
    const userLevelId = Number((adminToken as { userLevelId?: number } | null)?.userLevelId ?? 0);
    const isAccounting = role === "accounting" || userLevelId === 5;
    const isFinanceOfficer = role === "finance_officer" || userLevelId === 6;
    const isMerchantAdmin = role === "merchant_admin" || userLevelId === 7;
    const isSupplierAdmin = role === "supplier_admin" || userLevelId === 8;
    const hasAdminAccess = ADMIN_ALLOWED_ROLES.has(role) || isAccounting || isFinanceOfficer || isMerchantAdmin || isSupplierAdmin;

    if (adminToken && hasAdminAccess) {
      const redirectPath = isAccounting
        ? "/admin/accounting"
        : isFinanceOfficer
          ? "/admin/finance"
          : isMerchantAdmin
            ? "/admin/orders"
            : isSupplierAdmin
              ? "/admin/dashboard"
          : getAdminRedirectPath(role);
      return NextResponse.redirect(new URL(redirectPath, req.url));
    }
    return NextResponse.next();
  }

  if (isSupplierPublicPage) {
    const role = String((supplierToken as { role?: string } | null)?.role ?? "").toLowerCase();
    if (supplierToken && role === "supplier") {
      return NextResponse.redirect(new URL("/supplier/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (isAdminRoute) {
    if (!adminToken) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callback", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = String((adminToken as { role?: string } | null)?.role ?? "").toLowerCase();
    const userLevelId = Number((adminToken as { userLevelId?: number } | null)?.userLevelId ?? 0);
    const adminPermissions = normalizeAdminPermissions((adminToken as { adminPermissions?: string[] } | null)?.adminPermissions ?? []);
    const hasCustomAdminPermissions = (role === "admin" || userLevelId === 2) && adminPermissions.length > 0;
    const adminAllowedPrefixes = hasCustomAdminPermissions
      ? ["/admin/dashboard", ...adminPermissions.flatMap((permission) => ADMIN_PERMISSION_PREFIXES[permission] ?? [])]
      : ADMIN_ALLOWED_PREFIXES;
    const isAccounting = role === "accounting" || userLevelId === 5;
    const isFinanceOfficer = role === "finance_officer" || userLevelId === 6;
    const isMerchantAdmin = role === "merchant_admin" || userLevelId === 7;
    const isSupplierAdmin = role === "supplier_admin" || userLevelId === 8;
    const hasAdminAccess = ADMIN_ALLOWED_ROLES.has(role) || isAccounting || isFinanceOfficer || isMerchantAdmin || isSupplierAdmin;

    if (!hasAdminAccess) {
      return NextResponse.redirect(new URL("/", req.url));
    }

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

    if (isMerchantAdmin) {
      const allowed =
        pathname === "/admin" ||
        MERCHANT_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
      if (!allowed) {
        return NextResponse.redirect(new URL("/admin/orders", req.url));
      }
    }

    if (isSupplierAdmin) {
      const allowed =
        pathname === "/admin" ||
        ADMIN_SUPPLIER_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
      if (!allowed) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
    }

    if (role === "admin" || userLevelId === 2) {
      const allowed =
        pathname === "/admin" ||
        adminAllowedPrefixes.some((prefix) => pathname.startsWith(prefix));
      if (!allowed) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
    }
  }

  if (isSupplierRoute) {
    if (!supplierToken) {
      const loginUrl = new URL("/supplier/login", req.url);
      loginUrl.searchParams.set("callback", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = String((supplierToken as { role?: string } | null)?.role ?? "").toLowerCase();
    if (role !== "supplier") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const allowed =
      pathname === "/supplier" ||
      SUPPLIER_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (!allowed) {
      return NextResponse.redirect(new URL("/supplier/dashboard", req.url));
    }
  }

  if (isAuthRequiredRoute && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callback", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && passwordChangeRequired && (pathname.startsWith("/shop") || pathname.startsWith("/orders") || pathname === "/profile" || pathname === "/login")) {
    if (!isLoginPage) {
      const passwordUrl = new URL("/login", req.url);
      passwordUrl.searchParams.set("force-password-change", "1");
      return NextResponse.redirect(passwordUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/supplier/:path*", "/profile/:path*", "/orders/:path*", "/shop/:path*"],
};
