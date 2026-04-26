import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Term } from '@/lib/api';

// Pastel pill colors — semi-transparent, readable on any image
const PILL_COLORS = [
  'bg-white/60',
  'bg-rose/60',
  'bg-sage/60',
  'bg-cornflower/60',
  'bg-butter/65',
];

// Shared glass style
const GLASS = 'backdrop-blur-md border border-white/40 shadow-md';
const GLASS_BG = 'rgba(255,252,248,0.62)';

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
          /* Collapsed pill — same glass style as expanded */
          <motion.button
            key="pill"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.14 }}
            onClick={() => setOpen(true)}
            className={cn(
              'flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full cursor-pointer select-none',
              GLASS,
              'font-kalam text-xs text-ink leading-none hover:brightness-95 transition-all'
            )}
            style={{ background: GLASS_BG }}
          >
            <span className="font-semibold truncate max-w-[110px]">{first.termEn}</span>
            {rest.length > 0 && (
              <span className="flex-shrink-0 text-[10px] text-ink-light font-dm">+{rest.length}</span>
            )}
          </motion.button>
        ) : (
          /* Expanded panel — same glass, pills inside */
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={cn('flex flex-col gap-1 p-2 rounded-2xl', GLASS)}
            style={{ background: GLASS_BG, minWidth: 160, maxWidth: 220 }}
          >
            {terms.map((t, i) => (
              <TermRow
                key={t.id}
                term={t}
                colorClass={PILL_COLORS[i % PILL_COLORS.length]}
                onCopy={(e) => handleCopy(e, t.termEn, t.id)}
                onDelete={(e) => { e.stopPropagation(); onDeleteTerm(imageId, t.id); }}
                copied={copiedId === t.id}
              />
            ))}
            <button
              onClick={() => setOpen(false)}
              className="mt-0.5 text-center font-kalam text-[9px] text-ink/40 hover:text-ink/70 transition-colors"
            >
              收起
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TermRowProps {
  term: Term;
  colorClass: string;
  onCopy: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  copied: boolean;
}

function TermRow({ term, colorClass, onCopy, onDelete, copied }: TermRowProps) {
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
          'flex-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-left transition-all',
          'font-kalam text-[11px] text-ink leading-tight',
          colorClass,
          copied && 'ring-1 ring-ink/20'
        )}
      >
        <span className="font-semibold truncate">{term.termEn}</span>
        <span className="text-ink-light text-[9px] flex-shrink-0">{term.termZh}</span>
        {copied && <span className="ml-auto text-[9px] flex-shrink-0 text-ink/60">✓</span>}
      </button>

      <AnimatePresence>
        {hovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.1 }}
            onClick={onDelete}
            className="flex-shrink-0 w-4 h-4 rounded-full bg-ink/10 hover:bg-red-400/50 flex items-center justify-center transition-colors"
          >
            <X size={8} className="text-ink/50" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
