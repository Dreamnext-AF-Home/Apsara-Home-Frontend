export async function revalidateStorefront() {
  try {
    await fetch('/api/revalidate/storefront', {
      method: 'POST',
    })
  } catch {
    // Best-effort cache refresh only.
  }
}
