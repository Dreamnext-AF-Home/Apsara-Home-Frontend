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

export const { useRegisterMutation, useLogoutMutation, useAdminLoginMutation } = authApi
