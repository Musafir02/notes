import { ArrowUpRight } from 'lucide-react'
import Header from '../components/Header'

const FORM_URL = 'https://forms.gle/sXvqbiZkHMDdZENcA'

const STEPS = [
  { n: '01', text: 'Click the button below to open the upload form.' },
  { n: '02', text: 'Fill in your semester, subject, and attach your PDF.' },
  { n: '03', text: "Submit — we'll review and add it to the site." },
]

export default function UploadPage() {
  return (
    <div className="app">
      <Header />
      <main>
        <div className="upload-page-center">
          <section className="page-hero">
            <h1>Upload Notes</h1>
            <p className="page-sub">Contribute notes for your fellow students.</p>
          </section>

          <section className="section-upload">
            <ol className="upload-steps">
              {STEPS.map((s) => (
                <li key={s.n} className="upload-step">
                  <span className="upload-step-num">{s.n}</span>
                  <span className="upload-step-text">{s.text}</span>
                </li>
              ))}
            </ol>

            <a
              href={FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-upload btn-upload--form"
            >
              Open Upload Form
              <ArrowUpRight size={16} />
            </a>
          </section>
        </div>
      </main>
      <footer>
        <div className="container footer-inner">
          <span>© 2026 Padle</span>
        </div>
      </footer>
    </div>
  )
}
