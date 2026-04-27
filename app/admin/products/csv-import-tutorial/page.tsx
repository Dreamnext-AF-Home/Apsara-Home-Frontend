import { buildPageMetadata } from '@/app/seo'

export const metadata = buildPageMetadata({
  title: 'CSV Import Tutorial',
  description: 'Learn how to import products using CSV files and add images via CSV links or file uploads.',
  path: '/admin/products/csv-import-tutorial',
  noIndex: true,
})

export default function CsvImportTutorialPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">CSV Import Tutorial</h1>
          <p className="text-slate-500 mt-1">
            Learn how to import products using CSV files and add images via CSV links or file uploads.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <iframe
            src="/Images/tutorials/How to import product.pdf"
            className="w-full h-[calc(100vh-200px)]"
            title="CSV Import Tutorial PDF"
          />
        </div>
      </div>
    </div>
  )
}
