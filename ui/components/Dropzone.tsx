'use client';

import { useCallback, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { cn } from './cn';

interface DropzoneProps {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  label: string;
  hint: string;
  browseLabel: string;
}

/**
 * Drag & Drop ist nie der einzige Upload-Weg (Kap. 15): ein sichtbarer,
 * per Tastatur erreichbarer Button öffnet immer zusätzlich den nativen
 * Datei-Dialog.
 */
export function Dropzone({ onFiles, multiple = false, label, hint, browseLabel }: DropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragActive(false);
      const files = Array.from(event.dataTransfer.files);
      if (files.length > 0) onFiles(files);
    },
    [onFiles],
  );

  const openFileDialog = () => inputRef.current?.click();

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openFileDialog();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      onKeyDown={handleKeyDown}
      onClick={openFileDialog}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-10 text-center cursor-pointer transition-colors',
        isDragActive && 'border-primary bg-muted',
      )}
    >
      <p className="text-base font-medium">{label}</p>
      <p className="text-sm text-muted-foreground">{hint}</p>
      <span className="underline text-sm">{browseLabel}</span>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) onFiles(files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
