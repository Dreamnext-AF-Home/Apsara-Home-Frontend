import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react'

let cachedAccessToken: string | undefined
let cachedSessionPath: string | undefined
let tokenPromise: Promise<string | undefined> | null = null
let cachedAt = 0
const TOKEN_CACHE_TTL_MS = 120_000

export const clearAccessTokenCache = () => {
    cachedAccessToken = undefined
    cachedSessionPath = undefined
    tokenPromise = null
    cachedAt = 0
    if (typeof window !== 'undefined') {
        window.localStorage.removeItem('accessToken')
    }
}

const resolveAccessToken = async (): Promise<string | undefined> => {
    if (typeof window === 'undefined') return undefined

    const pathname = window.location.pathname || ''
    const sessionPath = pathname.startsWith('/admin')
        ? '/api/admin/auth/session'
        : pathname.startsWith('/partner')
          ? '/api/partner/auth/session'
        : pathname.startsWith('/supplier')
          ? '/api/supplier/auth/session'
          : '/api/auth/session'

    if (cachedAccessToken && cachedSessionPath === sessionPath && Date.now() - cachedAt < TOKEN_CACHE_TTL_MS) {
        return cachedAccessToken
    }

    if (!tokenPromise) {
        tokenPromise = fetch(sessionPath, {
            method: 'GET',
            cache: 'no-store',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                Pragma: 'no-cache',
            },
        })
            .then((response) => (response.ok ? response.json() : null))
            .then((session) => {
                const token = (session?.user as { accessToken?: string } | undefined)?.accessToken
                if (token) {
                    cachedAccessToken = token
                    cachedSessionPath = sessionPath
                    cachedAt = Date.now()
                    return token
                }

                cachedAccessToken = undefined
                cachedSessionPath = sessionPath
                cachedAt = Date.now()
                return undefined
            })
            .finally(() => {
                tokenPromise = null
            })
    }

    return tokenPromise
}

const baseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_LARAVEL_API_URL,
    // Laravel API requests authenticate via bearer tokens from NextAuth sessions.
    // Omitting browser cookies avoids Sanctum accidentally resolving a different
    // actor (for example a customer web session) before the intended admin token.
    credentials: 'omit',
    prepareHeaders: async (headers) => {
        const accessToken = await resolveAccessToken()

        if (accessToken) {
            headers.set('Authorization', `Bearer ${accessToken}`)
        }

        headers.set('Accept', 'application/json')
        // Let fetchBaseQuery set Content-Type automatically.
        // This is required for FormData requests (e.g., logo/favicon uploads),
        // where the browser must provide the multipart boundary.
        return headers
    }
})

let banSignOutInFlight = false
let adminSessionRecoveryInFlight = false

const baseQueryWithBanCheck: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
    args,
    api,
    extraOptions,
) => {
    let result = await baseQuery(args, api, extraOptions)
    const requestUrl = typeof args === 'string' ? args : String(args.url ?? '')

    if (result.error?.status === 401 && typeof window !== 'undefined') {
        clearAccessTokenCache()
        result = await baseQuery(args, api, extraOptions)
    }

    if (
        result.error?.status === 401 &&
        typeof window !== 'undefined' &&
        !requestUrl.includes('/auth/session')
    ) {
        // Token may be stale or unavailable during navigation transitions.
        // Clear cache and retry once with a freshly resolved session access token.
        clearAccessTokenCache()
        const retried = await baseQuery(args, api, extraOptions)
        if (!retried.error) {
            return retried
        }
        result = retried
    }

    if (
        result.error?.status === 401 &&
        (result.error.data as { reason?: string } | undefined)?.reason === 'banned' &&
        typeof window !== 'undefined' &&
        !banSignOutInFlight
    ) {
        banSignOutInFlight = true
        const { signOut } = await import('next-auth/react')
        const pathname = window.location.pathname || ''
        const isAdminRoute = pathname.startsWith('/admin')
        const isPartnerRoute = pathname.startsWith('/partner')
        const loginPath = isAdminRoute
            ? '/admin/login?suspended=1'
            : isPartnerRoute
              ? '/partner/login?suspended=1'
              : '/login?blocked=1'

        if (!isAdminRoute && !isPartnerRoute) {
            window.dispatchEvent(new CustomEvent('afhome:customer-blocked'))
            window.setTimeout(async () => {
                await signOut({ redirect: false })
                clearAccessTokenCache()
                window.location.replace(loginPath)
            }, 1800)
            return result
        }

        await signOut({ redirect: false })
        clearAccessTokenCache()
        window.location.replace(loginPath)
    }

    if (
        result.error?.status === 401 &&
        typeof window !== 'undefined' &&
        !adminSessionRecoveryInFlight
    ) {
        const pathname = window.location.pathname || ''
        const isAdminRoute = pathname.startsWith('/admin')
        const isAdminIdentityRequest = requestUrl.includes('/api/admin/auth/me')

        if (isAdminRoute && isAdminIdentityRequest) {
            adminSessionRecoveryInFlight = true
            const { signOut } = await import('next-auth/react')
            const { clearAdminSession } = await import('@/libs/adminSession')

            await signOut({ redirect: false })
            clearAccessTokenCache()
            await clearAdminSession('/admin/login?session=expired')
            window.location.replace('/admin/login?session=expired')
        }
    }

    return result
}

export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithBanCheck,
    tagTypes: ['User', 'AccountSnapshot', 'Members', 'Products', 'Categories', 'Brands', 'Orders', 'Encashment', 'AdminUsers', 'AdminNotifications', 'CustomerNotifications', 'SupplierNotifications', 'Wishlist', 'WebPages', 'Suppliers', 'InteriorRequests', 'AdminSettings', 'ExpenseCategories', 'Expenses', 'Cart', 'SearchHistory', 'ActivityLogs', 'ShippingRates', 'WebstoreRequests'],
    endpoints: () => ({}),
})
