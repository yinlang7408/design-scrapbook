import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Term } from '@/lib/api';

interface TermTagProps {
  terms: Term[];
  imageId: string;
  onDeleteTerm: (imageId: string, termId: string) => void;
}

export function TermTag({ terms, imageId, onDeleteTerm }: TermTagProps) {
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleCopy = useCallback((e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    });
  }, []);

  if (terms.length === 0) return null;
  const first = terms[0];
  const rest = terms.slice(1);

  return (
    <div ref={ref}>
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.button
            key="pill"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            onClick={() => setOpen(true)}
            className="flex items-center gap-1 pl-2.5 pr-2 py-1 rounded-full cursor-pointer select-none bg-white shadow-sm border border-[#e4e4e7] hover:shadow-md transition-shadow"
          >
            <span className="text-xs font-medium text-[#18181b] truncate max-w-[100px] leading-none">{first.termEn}</span>
            {rest.length > 0 && (
              <span className="text-[10px] text-[#71717a] leading-none">+{rest.length}</span>
            )}
          </motion.button>
        ) : (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="flex flex-col gap-1 p-1.5 rounded-xl bg-white border border-[#e4e4e7] shadow-lg"
            style={{ minWidth: 150, maxWidth: 210 }}
          >
            {terms.map((t) => (
              <TermRow
                key={t.id}
                term={t}
                onCopy={(e) => handleCopy(e, t.termEn, t.id)}
                onDelete={(e) => { e.stopPropagation(); onDeleteTerm(imageId, t.id); }}
                copied={copiedId === t.id}
              />
            ))}
            <button
              onClick={() => setOpen(false)}
              className="mt-0.5 text-center text-[9px] text-[#a1a1aa] hover:text-[#71717a] transition-colors"
            >
              collapse
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TermRowProps {
  term: Term;
  onCopy: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  copied: boolean;
}

function TermRow({ term, onCopy, onDelete, copied }: TermRowProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex items-center gap-1"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onCopy}
        className={cn(
          'flex-1 flex items-center gap-1.5 px-2 py-1 rounded-lg text-left transition-colors',
          'hover:bg-[#f4f4f5]',
          copied && 'bg-[#f4f4f5]'
        )}
      >
        <span className="text-[11px] font-medium text-[#18181b] truncate leading-tight">{term.termEn}</span>
        <span className="text-[9px] text-[#a1a1aa] flex-shrink-0">{term.termZh}</span>
        {copied && <span className="ml-auto text-[9px] text-[#71717a]">✓</span>}
      </button>

      <AnimatePresence>
        {hovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.1 }}
            onClick={onDelete}
            className="flex-shrink-0 w-5 h-5 rounded-full bg-[#f4f4f5] hover:bg-red-100 flex items-center justify-center transition-colors"
          >
            <X size={9} className="text-[#71717a] hover:text-red-500" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
