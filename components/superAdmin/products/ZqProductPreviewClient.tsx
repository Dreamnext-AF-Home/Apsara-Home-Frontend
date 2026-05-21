'use client'

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useImportZqToLocalMutation } from '@/store/api/productsApi'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import ZqProductPreviewPage, { extractZqImportDetail, type ZqImportDetailData } from './ZqProductPreviewPage'
import ZqCustomerProductPreview from '@/components/supplier/zq/ZqCustomerProductPreview'

export default function ZqProductPreviewClient({
  id,
  backHref,
  scopeLabel,
}: {
  id: string
  backHref: string
  scopeLabel: string
}) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [detail, setDetail] = useState<ZqImportDetailData | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [importedProductId, setImportedProductId] = useState<number | null>(null)
  const [importZqToLocal, { isLoading: isImporting }] = useImportZqToLocalMutation()

  useEffect(() => {
    const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken
    const apiUrl = process.env.NEXT_PUBLIC_LARAVEL_API_URL

    if (status === 'loading') {
      return
    }

    if (!accessToken) {
      setErrorMessage('No active session token found for this preview.')
      setIsLoading(false)
      return
    }

    if (!apiUrl) {
      setErrorMessage('NEXT_PUBLIC_LARAVEL_API_URL is not configured.')
      setIsLoading(false)
      return
    }

    let ignore = false

    const load = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const res = await fetch(`${apiUrl}/api/admin/products/zq/detail/${id}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          cache: 'no-store',
        })

        const json = (await res.json()) as { message?: string; zq?: Record<string, unknown> }

        if (!res.ok) {
          throw new Error(json.message || 'Failed to fetch global supplier product detail.')
        }

        if (!ignore) {
          setDetail(extractZqImportDetail(json.zq))
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error instanceof Error ? error.message : 'Failed to load global supplier product preview.')
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      ignore = true
    }
  }, [id, session, status])

  const handleImportToLocal = async () => {
    try {
      const result = await importZqToLocal(id).unwrap()
      setImportedProductId(result.product.id)
      showSuccessToast(result.message || 'Product imported to local catalog.')
    } catch (error) {
      const apiError = error as { data?: { message?: string } }
      showErrorToast(apiError?.data?.message || 'Failed to import product to local catalog.')
    }
  }

  const editHref = importedProductId
    ? `${backHref}?edit=${importedProductId}`
    : null
  const isSupplierPreview = backHref.startsWith('/supplier')

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-medium text-slate-500 shadow-sm">
        Loading global supplier product preview...
      </div>
    )
  }

  if (errorMessage || !detail) {
    return (
      <div className="space-y-4 rounded-3xl border border-rose-200 bg-rose-50 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">{scopeLabel}</p>
        <h1 className="text-2xl font-bold text-slate-900">Unable to load Global Supplier preview</h1>
        <p className="text-sm text-slate-600">{errorMessage || 'No detail was returned for this product.'}</p>
        <a
          href={backHref}
          className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Back to Product List
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Import banner */}
      {importedProductId ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-emerald-800">Product imported to local catalog.</p>
            <p className="mt-0.5 text-xs text-emerald-700">Status is set to Inactive — review and edit before publishing.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {editHref && (
              <button
                type="button"
                onClick={() => router.push(backHref)}
                className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                Go to Products &amp; Edit
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-sky-800">This is a Global Supplier product preview.</p>
            <p className="mt-0.5 text-xs text-sky-700">I-import sa local catalog para ma-edit, ma-publish, at ma-sell sa storefront.</p>
          </div>
          <button
            type="button"
            onClick={handleImportToLocal}
            disabled={isImporting}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
          >
            {isImporting ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Importing...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import to Local Products
              </>
            )}
          </button>
        </div>
      )}

      {isSupplierPreview ? (
        <ZqCustomerProductPreview detail={detail} backHref={backHref} />
      ) : (
        <ZqProductPreviewPage detail={detail} backHref={backHref} scopeLabel={scopeLabel} />
      )}
    </div>
  )
}
