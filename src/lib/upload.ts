export async function uploadToPinata(
  file: File,
  onProgress?: (p: number) => void
): Promise<{ cid: string; id?: string }> {
  const data = new FormData()
  data.append('file', file)

  const res = await fetch('/api/pinata/upload', {
    method: 'POST',
    body: data,
  })
  if (!res.ok) {
    let message = 'Upload failed'
    try {
      const err = await res.json()
      message = err?.error || message
    } catch {}
    throw new Error(message)
  }
  const json = await res.json()
  // json.data.cid as per Pinata API docs
  const cid = json?.data?.cid || json?.cid || json?.IpfsHash
  if (onProgress) onProgress(100)
  return { cid, id: json?.data?.id }
}


