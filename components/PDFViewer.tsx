import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
}

export default function PDFViewer({ url }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  const proxyUrl = `/api/proxy/pdf?url=${encodeURIComponent(url)}`;

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setError(null);
    setNumPages(numPages);
  }

  function onDocumentLoadError(error: Error): void {
    console.error('Error loading PDF:', error);
    setError('Impossible de charger le PDF. Veuillez télécharger le document.');
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500 text-sm mb-2">{error}</p>
        <a 
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600"
        >
          Télécharger le PDF
        </a>
      </div>
    );
  }

  return (
    <div className="pdf-viewer">
      <Document
        file={proxyUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        }
      >
        <Page
          pageNumber={pageNumber}
          width={300}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>
      {numPages > 1 && (
        <div className="flex justify-between items-center mt-2">
          <button
            onClick={() => setPageNumber(page => Math.max(page - 1, 1))}
            disabled={pageNumber <= 1}
            className="px-2 py-1 text-sm bg-gray-100 rounded disabled:opacity-50"
          >
            Précédent
          </button>
          <span className="text-sm text-gray-600">
            Page {pageNumber} sur {numPages}
          </span>
          <button
            onClick={() => setPageNumber(page => Math.min(page + 1, numPages))}
            disabled={pageNumber >= numPages}
            className="px-2 py-1 text-sm bg-gray-100 rounded disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}