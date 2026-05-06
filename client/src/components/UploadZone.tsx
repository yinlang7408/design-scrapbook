import { useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
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

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    await onUpload(file, date);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center border border-dashed transition-all duration-200 cursor-pointer',
        'border-[#d4d4d8] hover:border-[#a1a1aa]',
        dragOver && 'drop-active',
        disabled && 'opacity-30 pointer-events-none',
        isLoading && 'pointer-events-none'
      )}
      style={{ height: 56, width: '100%' }}
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
      {isLoading ? (
        <Loader2 size={13} className="text-[#a1a1aa] animate-spin" />
      ) : (
        <span className="text-[11px] text-[#b4b4b8]">paste &amp; upload</span>
      )}
    </div>
  );
}
