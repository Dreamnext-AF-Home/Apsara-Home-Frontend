import { baseApi } from "./baseApi";

export interface MeResponse {
    id: number;
    name: string;
    email: string;
    username?: string;
    phone?: string;
    avatar_url?: string;
    account_status?: number;
    lock_status?: number;
    verification_status?: 'verified' | 'pending_review' | 'not_verified' | 'blocked';
}

export interface UpdateProfilePayload {
    name: string;
    username?: string;
    phone?: string;
    avatar_url?: string;
}

export interface ReferralTreeNode {
    id: number;
    name: string;
    username: string;
    email: string;
    joined_at: string;
    total_earnings: number;
    verification_status: 'verified' | 'pending_review' | 'not_verified' | 'blocked';
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

        referralTree: builder.query<ReferralTreeResponse, void>({
            query: () => ({
                url: '/api/auth/referral-tree',
                method: 'GET',
            }),
            providesTags: ['User'],
        }),
    })
})

export const { useMeQuery, useUpdateProfileMutation, useReferralTreeQuery } = userApi
