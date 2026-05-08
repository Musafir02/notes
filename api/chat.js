const NIM_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(200).end()
  }

  if (req.method !== 'POST') return res.status(405).end()

  const key = process.env.NVIDIA_NIM_KEY || process.env.VITE_NVIDIA_NIM_KEY
  if (!key) return res.status(500).json({ error: 'NVIDIA_NIM_KEY not configured on server' })

  try {
    const upstream = await fetch(NIM_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    })

    const data = await upstream.json()
    res.status(upstream.status).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
