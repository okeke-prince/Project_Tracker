"use client";

import { useState, useEffect, useRef } from "react";
import { ReactReader } from "react-reader";
import { syncBookProgress } from "@/app/actions/reader";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EpubReaderProps {
  bookId: string;
  fileUrl: string;
  title: string;
  initialLocation: string | null;
}

export function EpubReader({ bookId, fileUrl, title, initialLocation }: EpubReaderProps) {
  const [location, setLocation] = useState<string | number>(initialLocation || 0);
  const renditionRef = useRef<any>(null);
  
  // Use a timeout to debounce database syncs so we don't spam the server on rapid page turns
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const locationChanged = (epubcifi: string) => {
    setLocation(epubcifi);

    if (renditionRef.current) {
      const rendition = renditionRef.current;
      const locationData = rendition.currentLocation();
      
      // Calculate percentage if available
      if (locationData && locationData.start && locationData.start.percentage !== undefined) {
        const percentage = Math.round(locationData.start.percentage * 100);
        
        // Debounce the sync
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => {
          syncBookProgress(bookId, percentage, epubcifi);
        }, 1000);
      }
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full">
      {/* Reader Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/books/${bookId}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-[400px]">{title}</h1>
        </div>
      </div>

      {/* Reader Body */}
      <div className="flex-1 relative bg-[#fafafa] dark:bg-[#121212]">
        <ReactReader
          url={fileUrl}
          location={location}
          locationChanged={locationChanged}
          getRendition={(rendition) => {
            renditionRef.current = rendition;
            // Generate locations right away so we can calculate percentage properly
            rendition.hooks.content.register((contents: any) => {
              const book = rendition.book;
              if (book.locations.length() === 0) {
                book.locations.generate(1600).then(() => {
                  // Trigger a re-render or initial sync once locations are generated if needed
                });
              }
            });
          }}
          epubInitOptions={{
            openAs: 'epub'
          }}
          readerStyles={{
            container: { overflow: 'hidden', height: '100%', position: 'relative' },
            readerArea: { width: '100%', height: '100%' },
            titleArea: { display: 'none' }, // We use our own header
            tocArea: { position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 10, width: 256, background: '#fff', borderRight: '1px solid #ddd' },
            tocButtonExpanded: { background: '#f2f2f2' },
            tocButton: { padding: 10, background: 'none', border: 'none', cursor: 'pointer' },
            tocButtonBar: { background: '#ccc', width: 20, height: 2, margin: '4px 0', display: 'block' },
            loadingView: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
          }}
        />
      </div>
    </div>
  );
}
