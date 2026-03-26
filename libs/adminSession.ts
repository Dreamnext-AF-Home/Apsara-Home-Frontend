'use client'

async function getAdminCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/admin/auth/csrf', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) return null

    const data = (await response.json()) as { csrfToken?: string }
    return typeof data.csrfToken === 'string' && data.csrfToken.trim() !== ''
      ? data.csrfToken
      : null
  } catch {
    return null
  }
}

export async function clearAdminSession(): Promise<void> {
  const csrfToken = await getAdminCsrfToken()
  if (!csrfToken) return

  const body = new URLSearchParams({
    csrfToken,
    json: 'true',
    callbackUrl: '/admin/login',
  })

  try {
    await fetch('/api/admin/auth/signout', {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })
  } catch {
    // Best-effort cleanup only.
  }
}
