"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { syncBookProgress } from "@/app/actions/reader";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Use CDN-hosted PDF.js worker to avoid Turbopack bundling issues
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfReaderProps {
  bookId: string;
  fileUrl: string;
  title: string;
  initialPage?: number;
}

export function PdfReader({ bookId, fileUrl, title, initialPage = 1 }: PdfReaderProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState(true);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  }, []);

  const goToPrevPage = () => {
    const newPage = Math.max(1, currentPage - 1);
    setCurrentPage(newPage);
    syncProgress(newPage, numPages);
  };

  const goToNextPage = () => {
    const newPage = Math.min(numPages, currentPage + 1);
    setCurrentPage(newPage);
    syncProgress(newPage, numPages);
  };

  const syncProgress = (page: number, total: number) => {
    if (total === 0) return;
    const percentage = Math.round((page / total) * 100);
    // Use page number as the "location" for PDFs
    syncBookProgress(bookId, percentage, `page:${page}`);
  };

  const zoomIn = () => setScale((s) => Math.min(2.5, +(s + 0.2).toFixed(1)));
  const zoomOut = () => setScale((s) => Math.max(0.5, +(s - 0.2).toFixed(1)));

  return (
    <div className="flex flex-col h-[100dvh] w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur z-10 shrink-0 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/books/${bookId}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-sm font-semibold truncate">{title}</h1>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut} disabled={scale <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn} disabled={scale >= 2.5}>
            <ZoomIn className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 ml-2 border rounded-md">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-r-none" onClick={goToPrevPage} disabled={currentPage <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs px-2 whitespace-nowrap">
              {currentPage} / {numPages || "…"}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-l-none" onClick={goToNextPage} disabled={currentPage >= numPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Body */}
      <div className="flex-1 overflow-auto bg-muted/30 flex justify-center p-4">
        {isLoading && (
          <div className="flex items-center justify-center w-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(err) => console.error("PDF load error:", err)}
          loading=""
        >
          <Page
            pageNumber={currentPage}
            scale={scale}
            className="shadow-xl"
            renderAnnotationLayer
            renderTextLayer
          />
        </Document>
      </div>
    </div>
  );
}
