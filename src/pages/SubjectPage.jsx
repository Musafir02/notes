import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import Header from '../components/Header'
import PdfViewer from '../components/PdfViewer'
import { SEMESTERS } from '../data/notes'

function IconPdf() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  )
}

function buildPdfUrl(pdfPath) {
  return '/' + pdfPath.split('/').map((seg) => encodeURIComponent(seg)).join('/')
}

export default function SubjectPage() {
  const { semId, subjectId } = useParams()
  const [activePdf, setActivePdf] = useState(null)

  const sem = SEMESTERS.find((s) => s.id === Number(semId))
  const subject = sem?.subjects.find((s) => s.id === subjectId)

  if (activePdf) {
    return (
      <div className="app app--viewer">
        <Header />
        <div className="viewer-bar">
          <div className="container viewer-bar-inner">
            <button className="breadcrumb btn-bare" onClick={() => setActivePdf(null)}>
              ← {subject?.name}
            </button>
            <span className="viewer-title">{activePdf.name}</span>
            <a
              href={buildPdfUrl(activePdf.path)}
              target="_blank"
              rel="noopener noreferrer"
              className="viewer-open-btn"
            >
              <ExternalLink size={13} />
              Open PDF
            </a>
          </div>
        </div>
        <div className="pdf-viewer-wrap">
          <PdfViewer url={buildPdfUrl(activePdf.path)} />
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <Header />
      <main>
        <section className="page-hero container">
          <Link to={`/sem/${semId}`} className="breadcrumb">← Semester {semId}</Link>
          <h1>{subject?.name ?? 'Subject'}</h1>
          {subject && subject.pdfs.length > 0 && (
            <p className="page-sub">{subject.pdfs.length} notes available</p>
          )}
        </section>
        <section className="section-pdfs container">
          {!subject || subject.pdfs.length === 0 ? (
            <p className="empty-state">No notes uploaded yet.</p>
          ) : (
            <>
              <p className="section-label">Notes</p>
              <div className="pdfs-list">
                {subject.pdfs.map((pdf, idx) => (
                  <button key={idx} className="pdf-item" onClick={() => setActivePdf(pdf)}>
                    <span className="pdf-item-icon">
                      <IconPdf />
                    </span>
                    <span className="pdf-item-name">{pdf.name}</span>
                    <span className="pdf-item-action">Read</span>
                  </button>
                ))}
              </div>
            </>
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
