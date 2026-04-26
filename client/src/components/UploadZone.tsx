import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  date: string;
  onUpload: (file: File, date: string) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
}

export function UploadZone({ date, onUpload, isLoading, disabled }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    await onUpload(file, date);
  }, [date, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = Array.from(e.clipboardData?.items ?? []);
    const imageItem = items.find(i => i.type.startsWith('image/'));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) processFile(file);
    }
  }, [processFile]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center gap-1',
        'border border-dashed rounded-lg transition-all duration-200 cursor-pointer',
        'border-[#d4d4d8] hover:border-[#a1a1aa] hover:bg-white/60',
        dragOver && 'drop-active',
        disabled && 'opacity-30 pointer-events-none',
        isLoading && 'pointer-events-none'
      )}
      style={{ minHeight: 64, padding: '8px' }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !isLoading && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) processFile(file);
          e.target.value = '';
        }}
      />

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-1">
            <Loader2 size={14} className="text-[#a1a1aa] animate-spin" />
            <span className="text-[9px] text-[#a1a1aa]">Uploading…</span>
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-1">
            <ImagePlus size={13} className="text-[#d4d4d8]" />
            <span className="text-[9px] text-[#c4c4c7] text-center leading-tight">drop · paste</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
