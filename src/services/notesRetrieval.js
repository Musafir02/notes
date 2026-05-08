import { SEMESTERS } from '../data/notes'

const cache = new Map()

function toTxtUrl(pdfPath) {
  const txt = pdfPath.replace(/\.(pdf|docx)$/i, '.txt')
  return '/context/' + txt.split('/').map(encodeURIComponent).join('/')
}

export async function loadSemesterTexts(semesterId) {
  const sem = SEMESTERS.find((s) => s.id === Number(semesterId))
  if (!sem) return {}

  const results = {}
  await Promise.all(
    sem.subjects.flatMap((subject) =>
      subject.pdfs.map(async (pdf) => {
        if (cache.has(pdf.path)) {
          results[pdf.path] = cache.get(pdf.path)
          return
        }
        try {
          const res = await fetch(toTxtUrl(pdf.path))
          if (!res.ok) return
          const text = await res.text()
          const entry = { name: pdf.name, subject: subject.name, text }
          cache.set(pdf.path, entry)
          results[pdf.path] = entry
        } catch {
          /* no text available for this PDF */
        }
      }),
    ),
  )
  return results
}

const STOP_WORDS = new Set([
  'what','is','the','a','an','of','and','or','in','on','to','for','with','by',
  'from','about','how','when','where','which','who','why','me','my','can','do',
  'does','did','has','have','had','be','been','are','was','were','will','would',
  'could','should','may','might','must','let','get','give','tell','show',
  'explain','define','describe','please','some','any','all','this','that','its',
])

const ABBR_EXPAND = {
  dbms: ['database','management','systems','relational'],
  dms:  ['database','management','systems'],
  os:   ['operating','systems','process','kernel'],
  ct:   ['computation','theory','automata','grammar'],
  toc:  ['computation','theory','automata'],
  aoa:  ['algorithms','analysis','complexity'],
  coa:  ['computer','organization','architecture'],
  dsgt: ['discrete','structures','graph','theory'],
  bee:  ['electrical','engineering','circuit'],
  mdm:  ['microprocessors','microcontrollers','assembly'],
}

function tokenize(str) {
  const raw = str.toLowerCase().match(/[a-z]{2,}|\d+/g) || []
  const expanded = []
  for (const t of raw) {
    if (STOP_WORDS.has(t)) continue
    expanded.push(t)
    if (ABBR_EXPAND[t]) expanded.push(...ABBR_EXPAND[t])
  }
  return [...new Set(expanded)]
}

function extractModuleNumber(query) {
  const m = query.match(/module\s*(\d+)/i) || query.match(/\bmod\s*(\d+)/i)
  return m ? m[1] : null
}

function scoreChunk(chunkWords, queryTerms) {
  const freq = new Map()
  chunkWords.forEach((w) => freq.set(w, (freq.get(w) || 0) + 1))
  return queryTerms.reduce((s, t) => (freq.has(t) ? s + 1 + Math.log(freq.get(t)) : s), 0)
}

export function findRelevantChunks(texts, query, topN = 6, wordsPerChunk = 500) {
  const queryTerms = tokenize(query)
  if (!queryTerms.length) return []
  const moduleNum = extractModuleNumber(query)

  const candidates = []
  Object.values(texts).forEach(({ name, subject, text }) => {
    const subjectTerms = tokenize(subject)
    const subjectBoost = queryTerms.filter((t) => subjectTerms.includes(t)).length * 3

    const nameTerms = tokenize(name)
    const nameBoost = moduleNum && nameTerms.includes(moduleNum) ? 8 : 0

    const words = text.split(/\s+/)
    const step = Math.floor(wordsPerChunk / 2)
    for (let i = 0; i < words.length; i += step) {
      const slice = words.slice(i, i + wordsPerChunk)
      if (slice.length < 30) continue
      const chunkStr = slice.join(' ')
      const chunkBoost = moduleNum && new RegExp(`module\\s*${moduleNum}\\b`, 'i').test(chunkStr) ? 6 : 0
      const score = scoreChunk(slice, queryTerms) + subjectBoost + nameBoost + chunkBoost
      if (score > 0) candidates.push({ text: chunkStr, score, source: `${subject} — ${name}` })
    }
  })

  return candidates.sort((a, b) => b.score - a.score).slice(0, topN)
}

export function buildNotesContext(chunks) {
  if (!chunks.length) return ''
  return chunks.map((c) => `[${c.source}]\n${c.text}`).join('\n\n---\n\n')
}
