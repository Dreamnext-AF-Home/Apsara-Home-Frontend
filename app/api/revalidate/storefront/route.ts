import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const expectedSecret = process.env.STORE_REVALIDATE_SECRET
  const providedSecret = request.headers.get('x-store-revalidate-secret')

  if (expectedSecret && providedSecret !== expectedSecret) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  revalidateTag('storefront:categories')
  revalidateTag('storefront:products')

  return NextResponse.json({ revalidated: true })
}
