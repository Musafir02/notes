import { Link } from 'react-router-dom'
import { BookOpen, Upload } from 'lucide-react'
import Header from '../components/Header'
import { SEMESTERS } from '../data/notes'

function CornerSquares() {
  return (
    <>
      <span className="csq csq-tl" />
      <span className="csq csq-tr" />
      <span className="csq csq-bl" />
      <span className="csq csq-br" />
    </>
  )
}

function StatBox({ value, label }) {
  return (
    <div className="stat-box">
      <span className="stat-box-val">{value}</span>
      <span className="stat-box-lbl">{label}</span>
    </div>
  )
}

function SemCard({ sem, index }) {
  const totalNotes = sem.subjects.reduce((a, s) => a + s.pdfs.length, 0)
  const isEmpty = sem.subjects.length === 0

  const inner = (
    <>
      {!isEmpty && <CornerSquares />}
      <div className="sem-card-header">
        <span className="sem-card-icon"><BookOpen size={17} /></span>
        <span className="sem-card-num">{String(sem.id).padStart(2, '0')}</span>
      </div>
      <div className="sem-card-body">
        <span className="sem-label">Semester {sem.id}</span>
        {isEmpty ? (
          <span className="sem-empty-tag">Coming soon</span>
        ) : (
          <>
            <ul className="sem-subjects-mini">
              {sem.subjects.slice(0, 3).map((s) => (
                <li key={s.id}>{s.name}</li>
              ))}
              {sem.subjects.length > 3 && (
                <li className="sem-subjects-more">+{sem.subjects.length - 3} more</li>
              )}
            </ul>
            <div className="sem-card-meta">
              <span>{sem.subjects.length} subj</span>
              <span className="meta-dot">·</span>
              <span>{totalNotes} notes</span>
            </div>
          </>
        )}
      </div>
    </>
  )

  return isEmpty ? (
    <div className="sem-card sem-card--empty" style={{ '--i': index }}>
      {inner}
    </div>
  ) : (
    <Link to={`/sem/${sem.id}`} className="sem-card" style={{ '--i': index }}>
      {inner}
    </Link>
  )
}

export default function Home() {
  const activeSems = SEMESTERS.filter((s) => s.subjects.length > 0).length
  const totalSubjects = SEMESTERS.reduce((a, s) => a + s.subjects.length, 0)
  const totalNotes = SEMESTERS.reduce(
    (a, s) => s.subjects.reduce((b, sub) => b + sub.pdfs.length, a),
    0
  )
  return (
    <div className="app">
      <Header />
      <main>
        <section className="hero-split container">
          <div className="hero-content">
            <p className="hero-eyebrow">Engineering Notes</p>
            <h1 className="hero-headline">
              Find your<br />semester notes.
            </h1>
            <p className="hero-desc">
              Community-written notes for every semester. Browse, read, and contribute.
            </p>
            <div className="hero-stats-row">
              <StatBox value={activeSems} label="Semesters" />
              <StatBox value={totalSubjects} label="Subjects" />
              <StatBox value={totalNotes} label="Notes" />
            </div>
          </div>
        </section>

        <section className="section-semesters container">
          <div className="section-header">
            <p className="section-label">All Semesters</p>
            <span className="section-count">{activeSems} of {SEMESTERS.length} active</span>
          </div>
          <div className="sem-grid">
            {SEMESTERS.map((sem, i) => (
              <SemCard key={sem.id} sem={sem} index={i} />
            ))}
          </div>
        </section>

        <section className="section-cta container">
          <div className="cta-inner">
            <div className="cta-text">
              <h3 className="cta-title">Have notes to share?</h3>
              <p className="cta-desc">Help other students by contributing your notes.</p>
            </div>
            <Link to="/upload" className="cta-btn">
              <Upload size={15} />
              Upload Notes
            </Link>
          </div>
        </section>
      </main>
      <footer>
        <div className="container footer-inner">
          <span>© 2026 Padle</span>
        </div>
      </footer>
    </div>
  )
}
