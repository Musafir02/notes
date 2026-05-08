import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import { Bot } from 'lucide-react'
import './App.css'
import Home from './pages/Home'
import SemesterPage from './pages/SemesterPage'
import SubjectPage from './pages/SubjectPage'
import UploadPage from './pages/UploadPage'
import ChatbotPage from './pages/ChatbotPage'

function ChatFab() {
  const { pathname } = useLocation()
  if (pathname === '/chat') return null
  return (
    <Link to="/chat" className="chat-fab" aria-label="Open AI Assistant">
      <Bot size={20} />
    </Link>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sem/:semId" element={<SemesterPage />} />
        <Route path="/sem/:semId/:subjectId" element={<SubjectPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/chat" element={<ChatbotPage />} />
      </Routes>
      <ChatFab />
      <SpeedInsights />
      <Analytics />
    </HashRouter>
  )
}
