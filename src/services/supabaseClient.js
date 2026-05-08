import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = url && key ? createClient(url, key) : null

export async function upsertUser(userName, semester) {
  if (!supabase) return
  await supabase.from('users').upsert(
    { name: userName, semester, last_active: new Date().toISOString() },
    { onConflict: 'name' },
  )
}

export async function upsertSession(sessionId, userName, semester, messages) {
  if (!supabase) return
  await supabase.from('chat_sessions').upsert(
    {
      session_id: sessionId,
      user_name: userName,
      semester,
      messages,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'session_id' },
  )
}

export async function getLatestSession(userName) {
  if (!supabase) return null
  try {
    const { data } = await supabase
      .from('chat_sessions')
      .select('session_id, semester, messages')
      .eq('user_name', userName)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
    return data || null
  } catch { return null }
}

export async function updateUserMemory(userName, topics) {
  if (!supabase) return
  await supabase
    .from('users')
    .update({ memory: { topics }, last_active: new Date().toISOString() })
    .eq('name', userName)
}

export async function getUserMemory(userName) {
  if (!supabase) return null
  try {
    const { data } = await supabase
      .from('users')
      .select('memory, semester')
      .eq('name', userName)
      .single()
    return data || null
  } catch { return null }
}
