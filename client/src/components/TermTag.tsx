import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check } from 'lucide-react';
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

  const copy = useCallback((text: string, id: string) => {
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
            className="flex items-center gap-1 pl-2.5 pr-2 py-1 rounded-full cursor-pointer select-none transition-all hover:scale-105"
            style={{
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
            }}
          >
            <span className="text-xs font-medium text-[#18181b] truncate max-w-[110px] leading-none">
              {first.termEn}
            </span>
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
            className="flex flex-col gap-0.5 p-1.5 rounded-xl shadow-lg"
            style={{
              minWidth: 155,
              maxWidth: 215,
              background: 'rgba(255,255,255,0.82)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            {terms.map((t) => (
              <TermRow
                key={t.id}
                term={t}
                onCopy={(e) => { e.stopPropagation(); copy(t.termEn, t.id); }}
                onDelete={(e) => { e.stopPropagation(); onDeleteTerm(imageId, t.id); }}
                copied={copiedId === t.id}
              />
            ))}
            <button
              onClick={() => setOpen(false)}
              className="mt-0.5 text-center text-[9px] text-[#b4b4b8] hover:text-[#71717a] transition-colors"
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
      className="flex items-center gap-1 px-2 py-1 rounded-lg transition-colors hover:bg-black/5"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Term text — not clickable itself */}
      <span className="flex-1 flex items-center gap-1.5 min-w-0">
        <span className="text-[11px] font-medium text-[#18181b] truncate leading-tight">{term.termEn}</span>
        <span className="text-[9px] text-[#a1a1aa] flex-shrink-0">{term.termZh}</span>
      </span>

      {/* Action icons — appear on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="flex items-center gap-0.5 flex-shrink-0"
          >
            {/* Copy */}
            <button
              onClick={onCopy}
              className="w-5 h-5 rounded flex items-center justify-center bg-black/5 hover:bg-black/10 transition-colors"
            >
              {copied
                ? <Check size={9} className="text-[#18181b]" />
                : <Copy size={9} className="text-[#71717a]" />
              }
            </button>
            {/* Delete */}
            <button
              onClick={onDelete}
              className="w-5 h-5 rounded flex items-center justify-center bg-black/5 hover:bg-red-100 transition-colors"
            >
              <X size={9} className="text-[#71717a]" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
