let libPromise = null

export function preloadPdfLib() {
  if (!libPromise) {
    libPromise = import('pdfjs-dist').then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).href
      return lib
    })
  }
  return libPromise
}

export function prefetchPdf(url) {
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = url
  link.as = 'fetch'
  link.crossOrigin = 'anonymous'
  document.head.appendChild(link)
}
