import { baseApi } from "./baseApi";

export interface MeResponse {
    id: number;
    name: string;
    email: string;
    username?: string;
    phone?: string;
    address?: string;
    barangay?: string;
    city?: string;
    province?: string;
    region?: string;
    zip_code?: string;
    avatar_url?: string;
    rank?: number;
    account_status?: number;
    lock_status?: number;
    verification_status?: 'verified' | 'pending_review' | 'on_hold' | 'not_verified' | 'blocked';
    email_verified?: boolean;
    password_change_required?: boolean;
}

export interface CustomerAddress {
    id: number;
    full_name: string;
    phone: string;
    address: string;
    barangay: string;
    city: string;
    province: string;
    region: string;
    zip_code?: string;
    address_type?: string;
    notes?: string;
    is_default: boolean;
    full_address: string;
}

export interface CustomerAddressesResponse {
    addresses: CustomerAddress[];
}

export interface CreateCustomerAddressPayload {
    full_name: string;
    phone: string;
    address: string;
    barangay: string;
    city: string;
    province: string;
    region: string;
    zip_code?: string;
    address_type?: string;
    notes?: string;
    set_default?: boolean;
}

export interface UpdateProfilePayload {
    name: string;
    username?: string;
    phone?: string;
    address?: string;
    barangay?: string;
    city?: string;
    province?: string;
    region?: string;
    zip_code?: string;
    avatar_url?: string;
}

export interface ChangePasswordPayload {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
}

export interface ReferralTreeNode {
    id: number;
    name: string;
    username: string;
    email: string;
    joined_at: string;
    total_earnings: number;
    verification_status: 'verified' | 'pending_review' | 'on_hold' | 'not_verified' | 'blocked';
    children_count?: number;
    children?: ReferralTreeNode[];
}

export interface ReferralTreeResponse {
    root: ReferralTreeNode;
    summary: {
        direct_count: number;
        second_level_count: number;
        total_network: number;
    };
    children: ReferralTreeNode[];
}

export const userApi = baseApi.injectEndpoints({
    endpoints:  (builder) => ({
        me: builder.query<MeResponse, void>({
            query: () => ({
                url: '/api/auth/me',
                method: 'GET'
            }),
            providesTags: ['User'],
        }),

        updateProfile: builder.mutation<MeResponse, UpdateProfilePayload>({
            query: (body) => ({
                url: '/api/auth/me',
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['User'],
        }),

        changePassword: builder.mutation<{ message: string; user: MeResponse }, ChangePasswordPayload>({
            query: (body) => ({
                url: '/api/auth/change-password',
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['User'],
        }),

        referralTree: builder.query<ReferralTreeResponse, void>({
            query: () => ({
                url: '/api/auth/referral-tree',
                method: 'GET',
            }),
            providesTags: ['User'],
        }),

        customerAddresses: builder.query<CustomerAddressesResponse, void>({
            query: () => ({
                url: '/api/auth/addresses',
                method: 'GET',
            }),
            providesTags: ['User'],
        }),

        createCustomerAddress: builder.mutation<{ message: string; address: CustomerAddress }, CreateCustomerAddressPayload>({
            query: (body) => ({
                url: '/api/auth/addresses',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['User'],
        }),

        setDefaultCustomerAddress: builder.mutation<{ message: string; address: CustomerAddress }, number>({
            query: (id) => ({
                url: `/api/auth/addresses/${id}/default`,
                method: 'PATCH',
            }),
            invalidatesTags: ['User'],
        }),
    })
})

export const {
    useMeQuery,
    useUpdateProfileMutation,
    useChangePasswordMutation,
    useReferralTreeQuery,
    useCustomerAddressesQuery,
    useCreateCustomerAddressMutation,
    useSetDefaultCustomerAddressMutation,
} = userApi
