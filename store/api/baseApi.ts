import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react'

let cachedAccessToken: string | undefined
let tokenPromise: Promise<string | undefined> | null = null
let cachedAt = 0
const TOKEN_CACHE_TTL_MS = 120_000

export const clearAccessTokenCache = () => {
    cachedAccessToken = undefined
    tokenPromise = null
    cachedAt = 0
    if (typeof window !== 'undefined') {
        window.localStorage.removeItem('accessToken')
    }
}

const resolveAccessToken = async (): Promise<string | undefined> => {
    if (typeof window === 'undefined') return undefined

    if (cachedAccessToken && Date.now() - cachedAt < TOKEN_CACHE_TTL_MS) {
        return cachedAccessToken
    }

    if (!tokenPromise) {
        const pathname = window.location.pathname || ''
        const sessionPath = pathname.startsWith('/admin')
            ? '/api/admin/auth/session'
            : pathname.startsWith('/supplier')
              ? '/api/supplier/auth/session'
              : '/api/auth/session'
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
                    cachedAt = Date.now()
                    return token
                }

                cachedAccessToken = undefined
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
        headers.set('Content-Type', 'application/json')
        return headers
    }
})

let banSignOutInFlight = false

const baseQueryWithBanCheck: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
    args,
    api,
    extraOptions,
) => {
    const result = await baseQuery(args, api, extraOptions)

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
        const loginPath = isAdminRoute ? '/admin/login?suspended=1' : '/login?blocked=1'

        if (!isAdminRoute) {
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

    return result
}

export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithBanCheck,
    tagTypes: ['User', 'Members', 'Products', 'Categories', 'Brands', 'Orders', 'Encashment', 'AdminUsers', 'AdminNotifications', 'CustomerNotifications', 'Wishlist', 'WebPages', 'Suppliers', 'InteriorRequests'],
    endpoints: () => ({}),
})
