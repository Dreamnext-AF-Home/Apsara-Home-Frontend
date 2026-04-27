import { baseApi } from './baseApi'

export interface ExpenseCategoryRef {
  id: number
  name: string
  status: number
}

export interface Expense {
  id: number
  category: ExpenseCategoryRef
  category_id: number
  sub_category_name?: string | null
  invoice_url?: string | null
  amount: number
  intent: string
  transaction_date: string
  status: number
  created_by_admin_id?: number | null
  created_at?: string | null
  updated_at?: string | null
}

interface ExpensesResponse {
  expenses: Expense[]
  total: number
  filtered_total_amount?: number
  current_page?: number
  per_page?: number
  last_page?: number
}

export interface ExpensesSummaryResponse {
  count: number
  total_amount: number
  from: string | null
  to: string | null
}

export interface GetExpensesParams {
  search?: string
  categoryId?: number
  dateFrom?: string
  dateTo?: string
  page?: number
  perPage?: number
}

export interface ExpensePayload {
  category_id: number
  sub_category_name?: string
  invoice_url?: string
  amount: number
  intent: string
  transaction_date: string
  status?: number
}

export const expensesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExpenses: builder.query<ExpensesResponse, GetExpensesParams | void>({
      query: (params) => ({
        url: '/api/admin/expenses',
        method: 'GET',
        params: {
          q: params?.search,
          category_id: params?.categoryId,
          date_from: params?.dateFrom,
          date_to: params?.dateTo,
          page: params?.page,
          per_page: params?.perPage,
        },
      }),
      providesTags: ['Expenses'],
    }),
    createExpense: builder.mutation<{ message: string; expense: Expense }, ExpensePayload | FormData>({
      query: (body) => ({
        url: '/api/admin/expenses',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Expenses'],
    }),
    updateExpense: builder.mutation<{ message: string; expense: Expense }, { id: number; data: ExpensePayload | FormData }>({
      query: ({ id, data }) => {
        if (data instanceof FormData) {
          const body = data
          if (!body.has('_method')) {
            body.append('_method', 'PUT')
          }
          return {
            url: `/api/admin/expenses/${id}`,
            method: 'POST',
            body,
          }
        }
        return {
          url: `/api/admin/expenses/${id}`,
          method: 'PUT',
          body: data,
        }
      },
      invalidatesTags: ['Expenses'],
    }),
    deleteExpense: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/api/admin/expenses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Expenses'],
    }),
    getExpensesSummary: builder.query<ExpensesSummaryResponse, { from?: string; to?: string; status?: number } | void>({
      query: (params) => ({
        url: '/api/admin/expenses/summary',
        method: 'GET',
        params: {
          from: params?.from,
          to: params?.to,
          status: params?.status,
        },
      }),
      providesTags: ['Expenses'],
    }),
  }),
})

export const {
  useGetExpensesQuery,
  useLazyGetExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useGetExpensesSummaryQuery,
} = expensesApi
