const MODEL = 'openai/gpt-oss-120b'
const CHAR_DELAY_MS = 4

export async function* streamMessage(messages, signal) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 1,
      top_p: 1,
      max_tokens: 4096,
      stream: false,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`NIM API ${res.status}: ${text}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content ?? ''

  for (const char of content) {
    if (signal?.aborted) return
    yield char
    await new Promise((r) => setTimeout(r, CHAR_DELAY_MS))
  }
}
