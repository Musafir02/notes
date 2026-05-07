import { useParams, Link } from 'react-router-dom'
import Header from '../components/Header'
import { SEMESTERS } from '../data/notes'

function IconBook() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function SubjectCard({ semId, subject }) {
  return (
    <Link to={`/sem/${semId}/${subject.id}`} className="subject-card">
      <span className="subject-icon">
        <IconBook />
      </span>
      <div className="subject-info">
        <h3>{subject.name}</h3>
        <span>{subject.pdfs.length} notes</span>
      </div>
      <span className="subject-chevron">→</span>
    </Link>
  )
}

export default function SemesterPage() {
  const { semId } = useParams()
  const sem = SEMESTERS.find((s) => s.id === Number(semId))

  return (
    <div className="app">
      <Header />
      <main>
        <section className="page-hero container">
          <Link to="/" className="breadcrumb">← All Semesters</Link>
          <h1>Semester {semId}</h1>
          {sem && sem.subjects.length > 0 && (
            <p className="page-sub">{sem.subjects.length} subjects available</p>
          )}
        </section>
        <section className="section-subjects container">
          {!sem || sem.subjects.length === 0 ? (
            <p className="empty-state">No notes uploaded yet for this semester.</p>
          ) : (
            <div className="subjects-list">
              {sem.subjects.map((sub) => (
                <SubjectCard key={sub.id} semId={semId} subject={sub} />
              ))}
            </div>
          )}
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
