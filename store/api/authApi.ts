import { baseApi } from './baseApi'

interface RegisterPayload {
  name: string
  first_name: string
  last_name: string
  middle_name?: string
  email: string
  password: string
  password_confirmation: string
  phone?: string
  username: string
  referred_by?: string
  birth_date?: string
  address?: string
  barangay?: string
  city?: string
  province?: string
  region?: string
  zip_code?: string
  gender?: 'male' | 'female' | 'other'
  occupation?: string
  work_location?: 'local' | 'overseas'
  country?: string
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
  }
}

export const authApi = baseApi.injectEndpoints({
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
    })
  }),
})

export const {
  useRegisterMutation,
  useVerifyRegisterOtpMutation,
  useResendRegisterOtpMutation,
  useLogoutMutation,
  useAdminLoginMutation,
} = authApi
