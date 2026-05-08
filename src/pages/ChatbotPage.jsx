import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Square, ArrowRight, Bot, RotateCcw, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { buildSystemPrompt, SEMESTER_SUBJECTS } from '../context/subjectContext'
import { streamMessage } from '../services/nimClient'
import { upsertSession, upsertUser, getLatestSession, updateUserMemory, getUserMemory } from '../services/supabaseClient'
import { loadSemesterTexts, findRelevantChunks, buildNotesContext } from '../services/notesRetrieval'

const STORAGE_USER = 'padle_chat_user'
const ACTIVE_SEMS = Object.keys(SEMESTER_SUBJECTS).map(Number)

function generateSessionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function storageKey(sessionId) {
  return `padle_chat_history_${sessionId}`
}

function saveLocal(sessionId, userName, semester, messages) {
  localStorage.setItem(STORAGE_USER, JSON.stringify({ sessionId, userName, semester }))
  localStorage.setItem(storageKey(sessionId), JSON.stringify(messages))
}

const MEMORY_KEY = (name) => `padle_memory_${name.toLowerCase()}`

function loadMemory(userName) {
  try {
    const raw = localStorage.getItem(MEMORY_KEY(userName))
    return raw ? JSON.parse(raw) : { topics: [] }
  } catch { return { topics: [] } }
}

function updateMemory(userName, userMessage) {
  const mem = loadMemory(userName)
  const trimmed = userMessage.trim().slice(0, 80)
  if (trimmed.length > 4) {
    mem.topics = [...new Set([trimmed, ...mem.topics])].slice(0, 10)
    localStorage.setItem(MEMORY_KEY(userName), JSON.stringify(mem))
  }
  return mem
}

function NameStep({ onNext }) {
  const [name, setName] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim().length < 2) return
    onNext(name.trim())
  }

  return (
    <div className="chat-step">
      <Bot size={36} className="chat-step-icon" />
      <h2 className="chat-step-title">Welcome to Padle AI</h2>
      <p className="chat-step-sub">Your personal engineering study assistant</p>
      <form className="chat-step-form" onSubmit={handleSubmit}>
        <label className="chat-input-label">What should I call you?</label>
        <input
          ref={inputRef}
          className="chat-text-input"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={32}
        />
        <button
          className="chat-primary-btn"
          type="submit"
          disabled={name.trim().length < 2}
        >
          Continue <ArrowRight size={15} />
        </button>
      </form>
    </div>
  )
}

function SemStep({ userName, onNext }) {
  const [selected, setSelected] = useState(null)
  const allSems = [1, 2, 3, 4, 5, 6, 7, 8]

  return (
    <div className="chat-step">
      <h2 className="chat-step-title">Hi, {userName}!</h2>
      <p className="chat-step-sub">Which semester are you studying?</p>
      <div className="chat-sem-grid">
        {allSems.map((s) => {
          const active = ACTIVE_SEMS.includes(s)
          return (
            <button
              key={s}
              className={`chat-sem-btn${selected === s ? ' selected' : ''}${!active ? ' disabled' : ''}`}
              onClick={() => active && setSelected(s)}
              disabled={!active}
            >
              <span className="chat-sem-label">Sem</span>
              <span className="chat-sem-num">{s}</span>
              {!active && <span className="chat-sem-soon">Soon</span>}
            </button>
          )
        })}
      </div>
      <button
        className="chat-primary-btn"
        disabled={!selected}
        onClick={() => onNext(selected)}
      >
        Start Chat <ArrowRight size={15} />
      </button>
    </div>
  )
}

function sanitize(raw) {
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .split('\n')
    .map((line) => (/^\s+$/.test(line) ? '' : line.trimEnd()))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const mdComponents = {
  img: ({ alt }) => alt ? <em className="chat-md-img-alt">[{alt}]</em> : null,
  table: ({ children }) => (
    <div className="chat-md-table-wrap"><table>{children}</table></div>
  ),
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`chat-msg ${isUser ? 'chat-msg--user' : 'chat-msg--ai'}`}>
      {!isUser && <span className="chat-msg-avatar"><Bot size={13} /></span>}
      <div className="chat-msg-bubble">
        {isUser ? (
          <span className="chat-msg-text">{msg.content}</span>
        ) : msg.streaming && !msg.content ? (
          <div className="chat-reading-indicator">
            <span className="chat-reading-dot" /><span className="chat-reading-dot" /><span className="chat-reading-dot" />
            <span className="chat-reading-label">
              {msg.sources?.length ? 'Reading notes…' : 'Thinking…'}
            </span>
          </div>
        ) : (
          <div className="chat-msg-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {sanitize(msg.content)}
            </ReactMarkdown>
            {msg.streaming && <span className="chat-cursor" />}
          </div>
        )}
        {!isUser && msg.sources && msg.sources.length > 0 && (
          <div className="chat-msg-sources">
            <span className="chat-msg-sources-label">Sources</span>
            <div className="chat-msg-source-pills">
              {msg.sources.map((src, i) => (
                <span key={i} className="chat-msg-source-pill">
                  <FileText size={10} />{src}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ChatStep({ userName, semester, sessionId, initialMessages, onReset }) {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [notesTexts, setNotesTexts] = useState({})
  const [notesLoading, setNotesLoading] = useState(true)
  const [memory] = useState(() => loadMemory(userName))
  const bottomRef = useRef(null)
  const messagesRef = useRef(null)
  const inputRef = useRef(null)
  const userScrolledUp = useRef(false)
  const abortRef = useRef(null)
  const systemPrompt = buildSystemPrompt(userName, semester)

  useEffect(() => {
    setNotesLoading(true)
    loadSemesterTexts(semester).then((texts) => {
      setNotesTexts(texts)
      setNotesLoading(false)
    })
  }, [semester])

  const scrollToBottom = (force = false) => {
    if (force || !userScrolledUp.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleMessagesScroll = () => {
    const el = messagesRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    userScrolledUp.current = distFromBottom > 120
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (messages.length === 0) {
      const subjectNames = (SEMESTER_SUBJECTS[semester] || []).map((s) => s.name).join(', ')
      const greeting = {
        role: 'assistant',
        content: `Hi ${userName}! 👋 I'm your Padle AI study assistant for Semester ${semester}. I can help you with ${subjectNames}. What would you like to study today?`,
      }
      const updated = [greeting]
      setMessages(updated)
      saveLocal(sessionId, userName, semester, updated)
    }
  }, [])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    userScrolledUp.current = false

    const userMsg = { role: 'user', content: text }
    const updatedWithUser = [...messages, userMsg]
    setMessages(updatedWithUser)

    const chunks = findRelevantChunks(notesTexts, text)
    const sources = [...new Set(chunks.map((c) => c.source))]
    const streamingMsg = { role: 'assistant', content: '', streaming: true, sources }
    setMessages([...updatedWithUser, streamingMsg])
    setIsStreaming(true)
    const controller = new AbortController()
    abortRef.current = controller
    const updatedMem = updateMemory(userName, text)
    updateUserMemory(userName, updatedMem.topics)
    const notesCtx = buildNotesContext(chunks)
    const memoryCtx = memory.topics.length > 1
      ? `\n\nStudent's recent study topics (from memory): ${memory.topics.slice(1).join(' | ')}` : ''
    const fullSystem = notesCtx
      ? `${systemPrompt}${memoryCtx}\n\nThe following excerpts are from the student's actual notes. Use them as your primary source.\nCite sources inline using the exact label in brackets, e.g. "According to [Operating Systems — module 6.txt]...".\n\n${notesCtx}`
      : `${systemPrompt}${memoryCtx}`

    const apiMessages = [
      { role: 'system', content: fullSystem },
      ...updatedWithUser.slice(-16).map((m) => ({ role: m.role, content: m.content })),
    ]

    try {
      let fullContent = ''
      for await (const token of streamMessage(apiMessages, controller.signal)) {
        fullContent += token
        setMessages((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: fullContent, streaming: true, sources }
          return copy
        })
      }
      const final = [...updatedWithUser, { role: 'assistant', content: fullContent, sources }]
      setMessages(final)
      saveLocal(sessionId, userName, semester, final)
      upsertSession(sessionId, userName, semester, final)
    } catch (err) {
      if (err.name === 'AbortError' || controller.signal.aborted) {
        const final = [...updatedWithUser, { role: 'assistant', content: fullContent, sources }]
        setMessages(final)
        saveLocal(sessionId, userName, semester, final)
      } else {
        const errMsg = { role: 'assistant', content: `Sorry, something went wrong: ${err.message}` }
        const final = [...updatedWithUser, errMsg]
        setMessages(final)
        saveLocal(sessionId, userName, semester, final)
      }
    } finally {
      setIsStreaming(false)
      inputRef.current?.focus()
      scrollToBottom(true)
    }
  }

  const handleStop = () => {
    abortRef.current?.abort()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-ui">
      <div className="chat-ui-header">
        <div className="chat-ui-header-left">
          <Bot size={16} />
          <span className="chat-ui-title">Padle AI</span>
          <span className="chat-ui-badge">Sem {semester}</span>
          {notesLoading && <span className="chat-ui-loading">loading notes…</span>}
          {!notesLoading && Object.keys(notesTexts).length > 0 && (
            <span className="chat-ui-notes-ok">{Object.keys(notesTexts).length} notes loaded</span>
          )}
        </div>
        <div className="chat-ui-header-right">
          <span className="chat-ui-user">{userName}</span>
          <button className="chat-reset-btn btn-bare" onClick={onReset} title="Start over">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="chat-messages" ref={messagesRef} onScroll={handleMessagesScroll}>
        {messages.map((msg, i) => (
          <ChatMessage key={i} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <textarea
          ref={inputRef}
          className="chat-input-field"
          placeholder="Ask anything about your subjects…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isStreaming}
        />
        {isStreaming ? (
          <button className="chat-stop-btn" onClick={handleStop}>
            <Square size={14} fill="currentColor" />
          </button>
        ) : (
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <Send size={15} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function ChatbotPage() {
  const [step, setStep] = useState('name')
  const [userName, setUserName] = useState('')
  const [semester, setSemester] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [initialMessages, setInitialMessages] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_USER)
    if (!raw) return
    try {
      const { sessionId: sid, userName: name, semester: sem } = JSON.parse(raw)
      const hist = JSON.parse(localStorage.getItem(storageKey(sid)) || '[]')
      setSessionId(sid)
      setUserName(name)
      setSemester(sem)
      setInitialMessages(hist)
      setStep('chat')
    } catch {
      localStorage.removeItem(STORAGE_USER)
    }
  }, [])

  const handleName = async (name) => {
    setUserName(name)
    setStep('loading')
    const session = await getLatestSession(name)
    if (session) {
      const localHist = localStorage.getItem(storageKey(session.session_id))
      const messages = localHist ? JSON.parse(localHist) : (session.messages || [])
      setSessionId(session.session_id)
      setSemester(session.semester)
      setInitialMessages(messages)
      saveLocal(session.session_id, name, session.semester, messages)
      setStep('chat')
    } else {
      setStep('sem')
    }
  }

  const handleSem = (sem) => {
    const sid = generateSessionId()
    setSessionId(sid)
    setSemester(sem)
    setInitialMessages([])
    setStep('chat')
    upsertUser(userName, sem)
  }

  const handleReset = () => {
    localStorage.removeItem(STORAGE_USER)
    if (sessionId) localStorage.removeItem(storageKey(sessionId))
    setStep('name')
    setUserName('')
    setSemester(null)
    setSessionId(null)
    setInitialMessages([])
  }

  return (
    <div className="chat-page">
      <button className="chat-back btn-bare" onClick={() => navigate('/')}>
        ← Home
      </button>

      {step === 'name' && <NameStep onNext={handleName} />}
      {step === 'loading' && (
        <div className="chat-step">
          <span className="chat-loading-spinner" />
          <p className="chat-step-sub">Looking up your account…</p>
        </div>
      )}
      {step === 'sem' && <SemStep userName={userName} onNext={handleSem} />}
      {step === 'chat' && sessionId && (
        <ChatStep
          userName={userName}
          semester={semester}
          sessionId={sessionId}
          initialMessages={initialMessages}
          onReset={handleReset}
        />
      )}
    </div>
  )
}
