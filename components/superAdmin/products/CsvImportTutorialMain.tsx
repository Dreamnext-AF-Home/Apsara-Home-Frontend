'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function CsvImportTutorialMain() {
  const [activeSection, setActiveSection] = useState('overview')

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'csv-format', label: 'CSV Format' },
    { id: 'importing-images', label: 'Importing Images' },
    { id: 'image-links', label: 'Using Image Links' },
    { id: 'common-errors', label: 'Common Errors' },
    { id: 'best-practices', label: 'Best Practices' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">CSV Import Tutorial</h1>
          <p className="text-slate-500 mt-1">
            Learn how to import products using CSV files and add images via CSV links or file uploads.
          </p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-64 shrink-0 hidden lg:block">
            <nav className="sticky top-6 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                    activeSection === section.id
                      ? 'bg-sky-500 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 space-y-6">
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">What is CSV Import?</h2>
                  <p className="text-slate-600 mb-4">
                    CSV (Comma-Separated Values) import allows you to bulk upload products to your store using a spreadsheet file. 
                    This is especially useful when you have many products to add at once.
                  </p>
                  <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                    <p className="text-sm text-sky-800">
                      <strong>Key Benefits:</strong> Save time, reduce manual entry errors, and maintain consistent product data across your catalog.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">Quick Start Steps</h2>
                  <ol className="space-y-3 text-slate-600">
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white text-xs font-bold">1</span>
                      <span>Prepare your CSV file with the correct column headers and product data</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white text-xs font-bold">2</span>
                      <span>Upload images to Cloudinary using the <Link href="/admin/products/import-image" className="text-sky-600 underline hover:text-sky-700">Import Image</Link> tool</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white text-xs font-bold">3</span>
                      <span>Copy the image URLs and add them to your CSV file</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white text-xs font-bold">4</span>
                      <span>Import the CSV file through the Products page</span>
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* CSV Format Section */}
            {activeSection === 'csv-format' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">Required CSV Columns</h2>
                  <p className="text-slate-600 mb-4">
                    Your CSV file must include the following columns with correct headers:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-3 font-semibold text-slate-800">Column</th>
                          <th className="text-left py-2 px-3 font-semibold text-slate-800">Description</th>
                          <th className="text-left py-2 px-3 font-semibold text-slate-800">Example</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-600">
                        <tr className="border-b border-slate-100">
                          <td className="py-2 px-3 font-mono text-xs">pd_name</td>
                          <td className="py-2 px-3">Product name</td>
                          <td className="py-2 px-3">Modern Sofa Set</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 px-3 font-mono text-xs">pd_parent_sku</td>
                          <td className="py-2 px-3">Product SKU</td>
                          <td className="py-2 px-3">SOFA-001</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 px-3 font-mono text-xs">pd_catid</td>
                          <td className="py-2 px-3">Category ID</td>
                          <td className="py-2 px-3">5</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 px-3 font-mono text-xs">pd_price_srp</td>
                          <td className="py-2 px-3">SRP Price</td>
                          <td className="py-2 px-3">15000.00</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 px-3 font-mono text-xs">pd_price_dp</td>
                          <td className="py-2 px-3">DP Price</td>
                          <td className="py-2 px-3">12000.00</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 px-3 font-mono text-xs">pd_image</td>
                          <td className="py-2 px-3">Primary image URL</td>
                          <td className="py-2 px-3">https://res.cloudinary.com/...</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-mono text-xs">pd_images</td>
                          <td className="py-2 px-3">Additional images (pipe-separated)</td>
                          <td className="py-2 px-3">url1|url2|url3</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                  <h3 className="text-sm font-bold text-amber-800 mb-2">Important Notes</h3>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Column headers must match exactly (case-sensitive)</li>
                    <li>• Multiple images in pd_images should be separated by the pipe character (|)</li>
                    <li>• Numeric fields should not contain currency symbols or commas</li>
                    <li>• Text fields with commas should be enclosed in double quotes</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Importing Images Section */}
            {activeSection === 'importing-images' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">How to Import Images</h2>
                  <p className="text-slate-600 mb-4">
                    Before adding images to your CSV, you need to upload them to Cloudinary using our built-in tool.
                  </p>

                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <h3 className="font-semibold text-slate-800 mb-2">Step 1: Go to Import Image</h3>
                      <p className="text-sm text-slate-600 mb-3">
                        Navigate to <span className="font-mono text-xs bg-slate-200 px-2 py-1 rounded">Products → Import Image</span> in the sidebar.
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4">
                      <h3 className="font-semibold text-slate-800 mb-2">Step 2: Upload Your Images</h3>
                      <p className="text-sm text-slate-600 mb-3">
                        Click the "Upload Images" button to open the Cloudinary widget. You can upload from:
                      </p>
                      <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                        <li>Your local device</li>
                        <li>Google Drive</li>
                        <li>Dropbox</li>
                        <li>Image Search</li>
                        <li>Direct URL</li>
                      </ul>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4">
                      <h3 className="font-semibold text-slate-800 mb-2">Step 3: Copy the URLs</h3>
                      <p className="text-sm text-slate-600 mb-3">
                        After uploading, the tool will generate image URLs. Click "Copy URLs" to copy them to your clipboard.
                      </p>
                      <div className="bg-slate-900 rounded-lg p-3">
                        <code className="text-xs text-emerald-300">
                          https://res.cloudinary.com/dc05ncs6l/image/upload/v1/apsara/products/...
                        </code>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4">
                      <h3 className="font-semibold text-slate-800 mb-2">Step 4: Add to CSV</h3>
                      <p className="text-sm text-slate-600">
                        Paste the URL into the pd_image column (for primary image) or pd_images column (for additional images, separated by |).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                  <h3 className="text-sm font-bold text-emerald-800 mb-2">Pro Tip</h3>
                  <p className="text-sm text-emerald-700">
                    You can upload multiple images at once. The Import Image tool will automatically join multiple URLs with the pipe separator (|) for easy pasting into your CSV.
                  </p>
                </div>
              </div>
            )}

            {/* Image Links Section */}
            {activeSection === 'image-links' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">Using Image Links in CSV</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">Single Image (Primary)</h3>
                      <p className="text-sm text-slate-600 mb-2">
                        For a single primary image, use the pd_image column:
                      </p>
                      <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                        <code className="text-xs text-emerald-300 whitespace-nowrap">
                          pd_image,https://res.cloudinary.com/dc05ncs6l/image/upload/v1/apsara/products/sofa.jpg
                        </code>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">Multiple Images</h3>
                      <p className="text-sm text-slate-600 mb-2">
                        For multiple images, use the pd_images column with pipe-separated URLs:
                      </p>
                      <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                        <code className="text-xs text-emerald-300 whitespace-nowrap">
                          pd_images,url1.jpg|url2.jpg|url3.jpg
                        </code>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">Both Primary and Additional Images</h3>
                      <p className="text-sm text-slate-600 mb-2">
                        You can use both columns together:
                      </p>
                      <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                        <code className="text-xs text-emerald-300 whitespace-nowrap">
                          pd_image,primary.jpg|pd_images,extra1.jpg|extra2.jpg|extra3.jpg
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="font-semibold text-slate-800 mb-3">Complete CSV Example</h3>
                  <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-xs text-emerald-300 whitespace-pre">
{`pd_name,pd_parent_sku,pd_catid,pd_price_srp,pd_price_dp,pd_image,pd_images
Modern Sofa,SOFA-001,5,15000.00,12000.00,https://res.cloudinary.com/.../sofa-main.jpg,https://res.cloudinary.com/.../sofa-side1.jpg|https://res.cloudinary.com/.../sofa-side2.jpg
Dining Table,TABLE-002,5,8000.00,6500.00,https://res.cloudinary.com/.../table-main.jpg,
Office Chair,CHAIR-003,5,3500.00,2800.00,https://res.cloudinary.com/.../chair-main.jpg,https://res.cloudinary.com/.../chair-back.jpg|https://res.cloudinary.com/.../chair-side.jpg`}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Common Errors Section */}
            {activeSection === 'common-errors' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">Common Import Errors</h2>
                  
                  <div className="space-y-4">
                    <div className="border-l-4 border-red-400 pl-4">
                      <h3 className="font-semibold text-red-700 mb-1">Missing Required Columns</h3>
                      <p className="text-sm text-slate-600">
                        Error: "Column pd_name not found"<br/>
                        Fix: Ensure all required column headers are present and spelled correctly.
                      </p>
                    </div>

                    <div className="border-l-4 border-red-400 pl-4">
                      <h3 className="font-semibold text-red-700 mb-1">Invalid Image URL</h3>
                      <p className="text-sm text-slate-600">
                        Error: "Invalid image format"<br/>
                        Fix: Make sure image URLs are complete and accessible. Use Cloudinary URLs from the Import Image tool.
                      </p>
                    </div>

                    <div className="border-l-4 border-red-400 pl-4">
                      <h3 className="font-semibold text-red-700 mb-1">Invalid Price Format</h3>
                      <p className="text-sm text-slate-600">
                        Error: "Price must be numeric"<br/>
                        Fix: Remove currency symbols (₱, $) and commas from price values. Use decimal points only.
                      </p>
                    </div>

                    <div className="border-l-4 border-red-400 pl-4">
                      <h3 className="font-semibold text-red-700 mb-1">Category Not Found</h3>
                      <p className="text-sm text-slate-600">
                        Error: "Category ID 999 does not exist"<br/>
                        Fix: Verify that the category ID in pd_catid exists in your Categories page.
                      </p>
                    </div>

                    <div className="border-l-4 border-red-400 pl-4">
                      <h3 className="font-semibold text-red-700 mb-1">Malformed CSV</h3>
                      <p className="text-sm text-slate-600">
                        Error: "CSV parsing failed"<br/>
                        Fix: Ensure your CSV is properly formatted. Use double quotes for fields containing commas.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                  <h3 className="text-sm font-bold text-amber-800 mb-2">Troubleshooting Tips</h3>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Always validate your CSV in a spreadsheet program before importing</li>
                    <li>• Test with a small batch (5-10 products) before doing a large import</li>
                    <li>• Keep a backup of your original CSV file</li>
                    <li>• Check that all image URLs are accessible in a browser before importing</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Best Practices Section */}
            {activeSection === 'best-practices' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">Best Practices</h2>
                  
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">Use High-Quality Images</h3>
                        <p className="text-sm text-slate-600">
                          Upload images at least 1200x1200px for optimal display. The Import Image tool automatically optimizes images.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">Organize Your Images</h3>
                        <p className="text-sm text-slate-600">
                          Name your image files descriptively before uploading (e.g., "sofa-grey-front.jpg" instead of "IMG_1234.jpg").
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">Batch Similar Products</h3>
                        <p className="text-sm text-slate-600">
                          Group products by category when importing to make it easier to review and fix any issues.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">Validate Data First</h3>
                        <p className="text-sm text-slate-600">
                          Use Excel or Google Sheets to validate your data before exporting to CSV. Check for typos and missing values.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">Keep SKU Consistent</h3>
                        <p className="text-sm text-slate-600">
                          Use a consistent SKU naming convention across all products for easier inventory management.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-sky-200 bg-sky-50 p-6">
                  <h3 className="text-sm font-bold text-sky-800 mb-2">Need More Help?</h3>
                  <p className="text-sm text-sky-700 mb-3">
                    If you encounter issues not covered in this tutorial, contact support or check the documentation.
                  </p>
                  <Link
                    href="/admin/products/import-image"
                    className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Go to Import Image Tool
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
