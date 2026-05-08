import { HashRouter, Routes, Route } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import './App.css'
import Home from './pages/Home'
import SemesterPage from './pages/SemesterPage'
import SubjectPage from './pages/SubjectPage'
import UploadPage from './pages/UploadPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sem/:semId" element={<SemesterPage />} />
        <Route path="/sem/:semId/:subjectId" element={<SubjectPage />} />
        <Route path="/upload" element={<UploadPage />} />
      </Routes>
      <SpeedInsights />
      <Analytics />
    </HashRouter>
  )
}
