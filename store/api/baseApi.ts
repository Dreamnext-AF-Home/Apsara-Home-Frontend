import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getSession } from "next-auth/react";

let cachedAccessToken: string | undefined
let tokenPromise: Promise<string | undefined> | null = null
let cachedAt = 0
const TOKEN_CACHE_TTL_MS = 30_000

const resolveAccessToken = async (): Promise<string | undefined> => {
    if (typeof window === 'undefined') return undefined

    const localToken = window.localStorage.getItem('accessToken') ?? undefined
    if (localToken) {
        cachedAccessToken = localToken
        cachedAt = Date.now()
        return localToken
    }

    if (cachedAccessToken && Date.now() - cachedAt < TOKEN_CACHE_TTL_MS) {
        return cachedAccessToken
    }

    if (!tokenPromise) {
        tokenPromise = getSession()
            .then((session) => {
                const token = (session?.user as { accessToken?: string } | undefined)?.accessToken
                cachedAccessToken = token
                cachedAt = Date.now()
                return token
            })
            .finally(() => {
                tokenPromise = null
            })
    }

    return tokenPromise
}

const baseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_LARAVEL_API_URL,
    credentials: 'include',
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

export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery,
    tagTypes: ['User', 'Members', 'Products', 'Categories', 'Orders'],
    endpoints: () => ({}),
})
