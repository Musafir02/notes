import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href

function PdfPage({ pdf, pageNum, containerWidth }) {
  const canvasRef = useRef(null)
  const [pageHeight, setPageHeight] = useState(Math.floor(containerWidth * 1.414))
  const hasRendered = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || containerWidth <= 0) return

    hasRendered.current = false
    setPageHeight(Math.floor(containerWidth * 1.414))

    let unmounted = false
    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting || hasRendered.current || unmounted) return
        hasRendered.current = true
        observer.disconnect()

        try {
          const page = await pdf.getPage(pageNum)
          if (unmounted) return
          const baseViewport = page.getViewport({ scale: 1 })
          const scale = containerWidth / baseViewport.width
          const viewport = page.getViewport({ scale })
          const dpr = window.devicePixelRatio || 1

          canvas.width = Math.floor(viewport.width * dpr)
          canvas.height = Math.floor(viewport.height * dpr)
          canvas.style.width = `${viewport.width}px`
          canvas.style.height = `${viewport.height}px`

          const ctx = canvas.getContext('2d')
          ctx.scale(dpr, dpr)
          await page.render({ canvasContext: ctx, viewport }).promise
          if (!unmounted) setPageHeight(Math.ceil(viewport.height))
        } catch {
          /* render error — placeholder stays */
        }
      },
      { rootMargin: '600px' },
    )

    observer.observe(canvas)
    return () => {
      unmounted = true
      observer.disconnect()
    }
  }, [pdf, pageNum, containerWidth])

  return (
    <div className="pdf-page-wrap" style={{ height: pageHeight }}>
      <canvas ref={canvasRef} className="pdf-page-canvas" />
    </div>
  )
}

export default function PdfViewer({ url }) {
  const containerRef = useRef(null)
  const [pdf, setPdf] = useState(null)
  const [numPages, setNumPages] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const update = () => {
      const style = getComputedStyle(el)
      const padH = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
      setContainerWidth(Math.floor(el.clientWidth - padH))
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    setPdf(null)
    setNumPages(0)
    setError(null)

    const task = pdfjsLib.getDocument(url)
    task.promise
      .then((loaded) => {
        if (!cancelled) {
          setPdf(loaded)
          setNumPages(loaded.numPages)
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this PDF.')
      })

    return () => {
      cancelled = true
      task.destroy()
    }
  }, [url])

  return (
    <div ref={containerRef} className="pdfjs-container">
      {!pdf && !error && (
        <div className="pdfjs-status">Loading PDF…</div>
      )}
      {error && (
        <div className="pdfjs-status pdfjs-status--error">{error}</div>
      )}
      {pdf && containerWidth > 0 &&
        Array.from({ length: numPages }, (_, i) => (
          <PdfPage
            key={`p${i + 1}-w${containerWidth}`}
            pdf={pdf}
            pageNum={i + 1}
            containerWidth={containerWidth}
          />
        ))
      }
    </div>
  )
}
