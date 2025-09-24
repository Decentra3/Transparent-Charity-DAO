import { NextRequest } from 'next/server'

// Using default runtime; Pinata uploads may require standard node runtime for larger payloads

export async function POST(req: NextRequest) {
  const jwt = process.env.PINATA_JWT
  if (!jwt) {
    return new Response(JSON.stringify({ error: 'PINATA_JWT not configured' }), { status: 500 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return new Response(JSON.stringify({ error: 'No file' }), { status: 400 })
  }

  const data = new FormData()
  data.append('file', file)
  data.append('network', 'public')

  const res = await fetch('https://uploads.pinata.cloud/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
    body: data,
  })

  if (!res.ok) {
    const text = await res.text()
    return new Response(text, { status: res.status })
  }

  const json = await res.json()
  // Normalize to { data: { cid, id } } as in Pinata docs
  const normalized = json?.data ? json : { data: { cid: json?.cid || json?.IpfsHash, id: json?.id } }
  return new Response(JSON.stringify(normalized), { status: 200, headers: { 'content-type': 'application/json' } })
}


