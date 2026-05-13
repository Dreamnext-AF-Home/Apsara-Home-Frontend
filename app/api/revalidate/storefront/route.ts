import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const expectedSecret = process.env.STORE_REVALIDATE_SECRET
  const providedSecret = request.headers.get('x-store-revalidate-secret')

  if (!expectedSecret) {
    return NextResponse.json({ message: 'Revalidate secret is not configured' }, { status: 503 })
  }

  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  revalidateTag('storefront:categories', 'max')
  revalidateTag('storefront:products', 'max')
  revalidateTag('storefront:shop-builder', 'max')
  revalidateTag('storefront:partner-storefronts', 'max')

  return NextResponse.json({ revalidated: true })
}
