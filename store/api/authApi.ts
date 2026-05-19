import type { FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { baseApi } from './baseApi'

interface RegisterPayload {
  name: string
  first_name: string
  last_name: string
  phone: string
  email: string
  password: string
  password_confirmation: string
  username: string
  referred_by: string
  cf_turnstile_response?: string
  partner_slug?: string
}

interface RegisterResponse {
  message: string
  requires_otp: boolean
  verification_token: string
  email: string
}

interface VerifyRegisterOtpPayload {
  verification_token: string
  otp: string
  debug_trace_id?: string
}

interface VerifyRegisterOtpResponse {
  message: string
}

interface ResendRegisterOtpPayload {
  verification_token: string
}

interface ResendRegisterOtpResponse {
  message: string
}

interface UsernameAvailabilityResponse {
  available: boolean
  message: string
}

interface EmailAvailabilityResponse {
  available: boolean
  message: string
}

interface ReferralAvailabilityResponse {
  available: boolean
  message: string
  normalized_referral: string
  referrer_username?: string | null
}

const isMissingReferralRouteError = (error: FetchBaseQueryError | undefined) => {
  if (!error) return false
  if (error.status === 404) return true

  const payload = error.data as { message?: string } | undefined
  const message = String(payload?.message ?? '').toLowerCase()
  return message.includes('could not be found') || message.includes('not found')
}

interface LogoutResponse {
  message: string
}

interface AdminLoginPayload {
  login: string;
  password: string;

}

interface AdminLoginResponse {
  message?: string;
  token: string;
  role?: string;
  user_level_id?: number;
  user?: {
    id?: number;
    role?: string;
    user_level_id?: number;
    email?: string
    admin_permissions?: string[]
    avatar_url?: string
    supplier_id?: number | null
  }
}

export interface AdminMeResponse {
  id: number
  name: string
  email: string
  username?: string
  role: string
  user_level_id: number
  supplier_id?: number | null
  admin_permissions?: string[]
  storefront_ids?: number[]
  disabled_storefront_ids?: number[]
  avatar_url?: string
}

interface UpdateAdminMePayload {
  name?: string
  avatar_url?: string | null
}

interface UpdateAdminMeResponse {
  message: string
  profile: AdminMeResponse
}

export const authApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    register: builder.mutation<RegisterResponse, RegisterPayload>({
      query: (body) => ({
        url: '/api/auth/register',
        method: 'POST',
        body,
      }),
    }),

    verifyRegisterOtp: builder.mutation<VerifyRegisterOtpResponse, VerifyRegisterOtpPayload>({
      query: (body) => ({
        url: '/api/auth/register/verify-otp',
        method: 'POST',
        body,
      }),
    }),

    resendRegisterOtp: builder.mutation<ResendRegisterOtpResponse, ResendRegisterOtpPayload>({
      query: (body) => ({
        url: '/api/auth/register/resend-otp',
        method: 'POST',
        body,
      }),
    }),

    checkUsernameAvailability: builder.query<UsernameAvailabilityResponse, string>({
      query: (username) => ({
        url: '/api/auth/register/check-username',
        method: 'GET',
        params: { username },
      }),
    }),

    checkEmailAvailability: builder.query<EmailAvailabilityResponse, string>({
      query: (email) => ({
        url: '/api/auth/register/check-email',
        method: 'GET',
        params: { email },
      }),
    }),

    checkReferralAvailability: builder.query<ReferralAvailabilityResponse, string>({
      async queryFn(referredBy, _api, _extraOptions, baseQuery) {
        const params = { referred_by: referredBy }
        const candidateUrls = [
          '/api/auth/register/check-referral',
          '/api/auth/check-referral',
          '/api/register/check-referral',
        ]

        let lastError: FetchBaseQueryError | undefined

        for (const url of candidateUrls) {
          const result = await baseQuery({
            url,
            method: 'GET',
            params,
          } as FetchArgs)

          if ('data' in result && result.data) {
            return { data: result.data as ReferralAvailabilityResponse }
          }

          if ('error' in result) {
            const error = result.error as FetchBaseQueryError
            if (!isMissingReferralRouteError(error)) {
              return { error }
            }

            lastError = error
          }
        }

        return {
          error: lastError ?? {
            status: 'CUSTOM_ERROR',
            error: 'Unable to check referral code right now.',
            data: { message: 'Unable to check referral code right now.' },
          },
        }
      },
    }),

    logout: builder.mutation<LogoutResponse, void>({
      query: () => ({
        url: '/api/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    adminLogin: builder.mutation<AdminLoginResponse, AdminLoginPayload>({
        query: (body) => ({
          url: '/api/admin/auth/login',
          method: 'POST',
          body,
        })
    }),
    getAdminMe: builder.query<AdminMeResponse, string | void>({
      query: () => ({
        url: '/api/admin/auth/me',
        method: 'GET',
      }),
      keepUnusedDataFor: 0,
      providesTags: ['AdminUsers'],
    }),
    updateAdminMe: builder.mutation<UpdateAdminMeResponse, UpdateAdminMePayload>({
      query: (body) => ({
        url: '/api/admin/auth/me',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['AdminUsers'],
    }),
  }),
})

export const {
  useRegisterMutation,
  useVerifyRegisterOtpMutation,
  useResendRegisterOtpMutation,
  useLazyCheckEmailAvailabilityQuery,
  useLazyCheckUsernameAvailabilityQuery,
  useLazyCheckReferralAvailabilityQuery,
  useLogoutMutation,
  useAdminLoginMutation,
  useGetAdminMeQuery,
  useUpdateAdminMeMutation,
} = authApi
