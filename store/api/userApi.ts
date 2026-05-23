import { baseApi } from "./baseApi";

export interface MeResponse {
    id: number;
    name: string;
    email: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    middle_name?: string | null;
    birth_date?: string | null;
    gender?: 'male' | 'female' | 'other' | null;
    occupation?: string | null;
    work_location?: 'local' | 'overseas' | null;
    country?: string | null;
    referrer_id?: number;
    referrer_username?: string | null;
    referrer_name?: string | null;
    phone?: string;
    address?: string;
    barangay?: string;
    city?: string;
    province?: string;
    region?: string;
    barangay_code?: string;
    city_code?: string;
    province_code?: string;
    region_code?: string;
    zip_code?: string;
    avatar_url?: string;
    avatar_original_url?: string;
    rank?: number;
    account_status?: number;
    lock_status?: number;
    verification_status?: 'verified' | 'pending_review' | 'on_hold' | 'not_verified' | 'blocked';
    monthly_activation?: {
        status: 'active' | 'inactive';
        threshold_pv: number;
        current_month_pv: number;
        qualifying_pv: number;
        remaining_pv: number;
        deadline_day: number;
        deadline_at?: string | null;
        window_open: boolean;
        evaluated_at?: string | null;
        month_key: string;
        month_label: string;
    };
    email_verified?: boolean;
    password_change_required?: boolean;
    profile_complete?: boolean;
    profile_completion_percentage?: number;
    two_factor_enabled?: boolean;
    totp_enabled?: boolean;
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
    first_name?: string;
    last_name?: string;
    username?: string;
    phone?: string;
    middle_name?: string;
    birth_date?: string;
    gender?: 'male' | 'female' | 'other';
    occupation?: string;
    work_location?: 'local' | 'overseas';
    country?: string;
    address?: string;
    barangay?: string;
    city?: string;
    province?: string;
    region?: string;
    barangay_code?: string;
    city_code?: string;
    province_code?: string;
    region_code?: string;
    zip_code?: string;
    avatar_url?: string;
    avatar_original_url?: string;
    two_factor_enabled?: boolean;
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
    avatar_url?: string;
    joined_at: string;
    total_earnings: number;
    total_pv?: number;
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
        total_pv?: number;
    };
    children: ReferralTreeNode[];
}

export interface MemberActivityItem {
    id: number;
    activity_type: string;
    action: string;
    title: string;
    description: string;
    created_at?: string | null;
    ip_address?: string;
    user_agent?: string;
}

export interface MemberSessionItem {
    id: number;
    token_id: number;
    ip_address?: string;
    user_agent?: string;
    location?: string;
    created_at: string;
    last_used_at?: string;
    last_active_at?: string;
    is_current: boolean;
    device?: string;
    platform?: string;
    browser?: string;
}

export interface UsernameChangeRequest {
    id: number;
    reference_no: string;
    status: 'pending_review' | 'approved' | 'rejected';
    requested_username: string;
    review_notes?: string | null;
    reviewed_at?: string | null;
    created_at?: string | null;
}

export interface SendUsernameChangeOtpPayload {
    username: string;
}

export interface SendUsernameChangeOtpResponse {
    message: string;
    verification_token: string;
    email: string;
}

export interface SubmitUsernameChangePayload {
    verification_token: string;
    otp: string;
}

export interface SubmitUsernameChangeResponse {
    message: string;
    request: UsernameChangeRequest;
}

export interface SubmitWebstoreRequestPayload {
    full_name: string;
    username: string;
    email: string;
    slug_name: string;
    display_name: string;
    plan: 'quarterly' | 'semi_annual' | 'annual';
    billing_option: 'full' | 'monthly';
    payment_method: 'gcash' | 'grab_pay' | 'maya' | 'card' | 'online_banking';
    receipt_urls: string[];
    checkout_id?: string | null;
    payment_reference?: string | null;
    payment_intent_id?: string | null;
    accepted_terms: boolean;
}

export interface SubmitWebstoreRequestResponse {
    message: string;
    request: {
        id: number;
        submitted_at?: string;
        reference_no?: string;
        status?: 'pending_review' | 'approved' | 'rejected';
        created_at?: string;
    };
}

export interface WebstoreRequest {
    id: number;
    reference_no: string;
    status: 'pending_review' | 'approved' | 'rejected';
    full_name?: string | null;
    username?: string | null;
    email?: string | null;
    slug_name?: string | null;
    display_name?: string | null;
    plan?: 'quarterly' | 'semi_annual' | 'annual' | null;
    billing_option?: 'full' | 'monthly' | null;
    payment_method?: 'gcash' | 'grab_pay' | 'maya' | 'card' | 'online_banking' | null;
    receipt_urls?: string[] | null;
    base_checkout_id?: string | null;
    base_payment_reference?: string | null;
    base_payment_intent_id?: string | null;
    reviewed_at?: string | null;
    created_at?: string | null;
    payment_count?: number;
    total_paid_amount?: number;
    remaining_balance?: number;
    can_sync_account?: boolean;
    partner_sync_status?: 'synced' | 'not_synced';
    latest_receipt_status?: 'pending_review' | 'approved' | 'rejected' | null;
    latest_receipt_message?: string | null;
    latest_receipt_detail_id?: number | null;
    latest_receipt_submitted_at?: string | null;
}

export interface UploadWebstoreReceiptResponse {
    message: string;
    url: string;
    public_id?: string;
}

export interface CreateWebstorePaymentSessionPayload {
    plan: 'quarterly' | 'semi_annual' | 'annual';
    billing_option: 'full' | 'monthly';
    payment_method: 'gcash' | 'grab_pay' | 'maya' | 'card' | 'online_banking';
    payment_mode?: 'test' | 'live';
}

export interface CreateWebstorePaymentSessionResponse {
    checkout_id: string;
    checkout_url: string;
    payment_mode?: 'test' | 'live';
}

export interface VerifyWebstorePaymentSessionResponse {
    checkout_id: string;
    status: string;
    is_paid: boolean;
    payment_mode?: 'test' | 'live';
    payment_method?: 'gcash' | 'grab_pay' | 'maya' | 'card' | 'online_banking' | string;
    proof_url?: string;
    payment_intent_id?: string;
    payment_reference?: string;
    raw?: Record<string, unknown>;
}

export interface LinkedAccount {
    provider: string;
    linked_at: string;
}

export interface LinkedAccountsResponse {
    accounts: LinkedAccount[];
}

export interface AccountSnapshot {
    profile: {
        id: number;
        username: string;
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
        avatar_url: string;
        verification_status: string;
        account_status: string;
    };
    loyalty: {
        tier: string;
        rank: number;
        badge_name: string;
        total_orders: number;
        total_spent: number;
        total_earnings: number;
        pv_balance: number;
        cash_balance: number;
        personal_pv: number;
        active_members_count: number;
        active_builders_count: number;
        active_leaders_count: number;
        referral_count: number;
        direct_referrals?: ReferralTreeNode[];
        join_date: string;
        last_login: string | null;
    };
    orders: {
        total: number;
        pending: number;
        paid: number;
        shipped: number;
        delivered: number;
        completed: number;
        total_spent: number;
        recent_orders: any[];
    };
    wishlist: {
        total_items: number;
    };
    reviews: {
        total: number;
        average_rating: number;
        recent_reviews: any[];
    };
    snapshot_date: string;
}

export interface LinkGooglePayload {
    provider_id: string;
    token: string;
    email: string;
    name: string;
}

export interface LinkFacebookPayload {
    provider_id: string;
    token: string;
    email: string;
    name: string;
}

export interface SetupTotpResponse {
    qr_code_url: string;
    secret: string;
}

export interface EnableTotpPayload {
    code: string;
}

export interface DisableTotpPayload {
    code: string;
}

export interface UploadAvatarResponse {
    message: string;
    avatar_url: string;
    avatar_original_url?: string;
    user: MeResponse;
}

export const userApi = baseApi.injectEndpoints({
    overrideExisting: true,
    endpoints:  (builder) => ({
        me: builder.query<MeResponse, void>({
            query: () => ({
                url: '/api/auth/me',
                method: 'GET'
            }),
            providesTags: ['User'],
        }),

        accountSnapshot: builder.query<AccountSnapshot, void>({
            query: () => ({
                url: '/api/account/snapshot',
                method: 'GET'
            }),
            providesTags: ['User', 'AccountSnapshot'],
        }),

        updateProfile: builder.mutation<MeResponse, UpdateProfilePayload>({
            query: (body) => ({
                url: '/api/auth/me',
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['User', 'AccountSnapshot'],
        }),

        uploadAvatar: builder.mutation<UploadAvatarResponse, FormData>({
            query: (body) => ({
                url: '/api/me/avatar',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['User', 'AccountSnapshot'],
        }),

        changePassword: builder.mutation<{ message: string; user: MeResponse }, ChangePasswordPayload>({
            query: (body) => ({
                url: '/api/auth/change-password',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['User'],
        }),

        referralTree: builder.query<ReferralTreeResponse, number | string | void>({
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

        sendUsernameChangeOtp: builder.mutation<SendUsernameChangeOtpResponse, SendUsernameChangeOtpPayload>({
            query: (body) => ({
                url: '/api/auth/username-change/send-otp',
                method: 'POST',
                body,
            }),
        }),

        submitUsernameChangeRequest: builder.mutation<SubmitUsernameChangeResponse, SubmitUsernameChangePayload>({
            query: (body) => ({
                url: '/api/auth/username-change/submit',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['User'],
        }),

        submitWebstoreRequest: builder.mutation<SubmitWebstoreRequestResponse, SubmitWebstoreRequestPayload>({
            query: (body) => ({
                url: '/api/webstore-requests',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['User', 'WebstoreRequests', 'AdminNotifications'],
        }),

        uploadWebstoreReceipt: builder.mutation<UploadWebstoreReceiptResponse, FormData>({
            query: (body) => ({
                url: '/api/webstore-requests/receipt',
                method: 'POST',
                body,
            }),
        }),

        createWebstorePaymentSession: builder.mutation<CreateWebstorePaymentSessionResponse, CreateWebstorePaymentSessionPayload>({
            query: (body) => ({
                url: '/api/webstore-requests/payment-session',
                method: 'POST',
                body,
            }),
        }),

        verifyWebstorePaymentSession: builder.query<VerifyWebstorePaymentSessionResponse, { checkoutId: string; paymentMode?: 'test' | 'live' }>({
            query: ({ checkoutId, paymentMode }) => ({
                url: `/api/webstore-requests/payment-session/${checkoutId}`,
                method: 'GET',
                params: paymentMode ? { payment_mode: paymentMode } : undefined,
            }),
        }),

        usernameChangeLatest: builder.query<{ request: UsernameChangeRequest | null }, void>({
            query: () => ({
                url: '/api/auth/username-change/latest',
                method: 'GET',
            }),
            providesTags: ['User'],
        }),

        webstoreRequestLatest: builder.query<{ request: WebstoreRequest | null }, void>({
            query: () => ({
                url: '/api/webstore-requests/latest',
                method: 'GET',
            }),
            providesTags: ['User', 'WebstoreRequests'],
        }),

        syncWebstorePartnerAccount: builder.mutation<{ message: string; partner?: { id: number; username: string; storefront_ids: number[] } }, void>({
            query: () => ({
                url: '/api/webstore-requests/sync-account',
                method: 'POST',
            }),
            invalidatesTags: ['User', 'WebstoreRequests', 'AdminNotifications'],
        }),

        memberActivity: builder.query<{ items: MemberActivityItem[] }, void>({
            query: () => ({
                url: '/api/auth/activity',
                method: 'GET',
            }),
            providesTags: ['User'],
        }),

        memberSessions: builder.query<{ items: MemberSessionItem[] }, void>({
            query: () => ({
                url: '/api/auth/sessions',
                method: 'GET',
            }),
            providesTags: ['User'],
        }),

        revokeMemberSession: builder.mutation<{ message: string; revoked_token_id: number; is_current: boolean }, number>({
            query: (tokenId) => ({
                url: `/api/auth/sessions/${tokenId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['User'],
        }),

        linkedAccounts: builder.query<LinkedAccountsResponse, void>({
            query: () => ({
                url: '/api/auth/linked-accounts',
                method: 'GET',
            }),
            providesTags: ['User'],
        }),

        linkGoogleAccount: builder.mutation<{ message: string }, LinkGooglePayload>({
            query: (body) => ({
                url: '/api/auth/link/google',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['User'],
        }),

        unlinkGoogleAccount: builder.mutation<{ message: string }, void>({
            query: () => ({
                url: '/api/auth/unlink/google',
                method: 'POST',
            }),
            invalidatesTags: ['User'],
        }),

        linkFacebookAccount: builder.mutation<{ message: string }, LinkFacebookPayload>({
            query: (body) => ({
                url: '/api/auth/link/facebook',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['User'],
        }),

        unlinkFacebookAccount: builder.mutation<{ message: string }, void>({
            query: () => ({
                url: '/api/auth/unlink/facebook',
                method: 'POST',
            }),
            invalidatesTags: ['User'],
        }),

        setupTotp: builder.mutation<SetupTotpResponse, void>({
            query: () => ({
                url: '/api/auth/totp/setup',
                method: 'POST',
            }),
        }),

        enableTotp: builder.mutation<{ message: string }, EnableTotpPayload>({
            query: (body) => ({
                url: '/api/auth/totp/enable',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['User'],
        }),

        disableTotp: builder.mutation<{ message: string }, DisableTotpPayload>({
            query: (body) => ({
                url: '/api/auth/totp/disable',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['User'],
        }),
    })
})

export const {
    useMeQuery,
    useAccountSnapshotQuery,
    useCustomerAddressesQuery,
    useCreateCustomerAddressMutation,
    useSetDefaultCustomerAddressMutation,
    useUpdateProfileMutation,
    useUploadAvatarMutation,
    useChangePasswordMutation,
    useSendUsernameChangeOtpMutation,
    useSubmitUsernameChangeRequestMutation,
    useSubmitWebstoreRequestMutation,
    useUploadWebstoreReceiptMutation,
    useCreateWebstorePaymentSessionMutation,
    useLazyVerifyWebstorePaymentSessionQuery,
    useUsernameChangeLatestQuery,
    useWebstoreRequestLatestQuery,
    useSyncWebstorePartnerAccountMutation,
    useReferralTreeQuery,
    useMemberActivityQuery,
    useMemberSessionsQuery,
    useRevokeMemberSessionMutation,
    useLinkedAccountsQuery,
    useLinkGoogleAccountMutation,
    useUnlinkGoogleAccountMutation,
    useLinkFacebookAccountMutation,
    useUnlinkFacebookAccountMutation,
    useSetupTotpMutation,
    useEnableTotpMutation,
    useDisableTotpMutation,
} = userApi
