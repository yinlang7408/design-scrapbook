import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, RefreshCw } from 'lucide-react';
import { TermTag } from './TermTag';
import { seededRandom, cn } from '@/lib/utils';
import type { ImageRecord } from '@/lib/api';

const WASHI_COLORS = [
  'bg-washi-pink', 'bg-washi-blue', 'bg-washi-green',
  'bg-washi-yellow', 'bg-washi-lavender',
];

function Decoration({ seed }: { seed: string }) {
  const rng = seededRandom(seed + 'deco');
  const type = Math.floor(rng() * 3);
  const colorIdx = Math.floor(rng() * WASHI_COLORS.length);
  if (type === 0) {
    const rotate = (rng() - 0.5) * 20;
    const left = 25 + rng() * 50;
    return (
      <div
        className={cn('absolute h-5 w-14 opacity-70 rounded-sm pointer-events-none z-10', WASHI_COLORS[colorIdx])}
        style={{ top: -7, left: `${left}%`, transform: `translateX(-50%) rotate(${rotate}deg)` }}
      />
    );
  }
  if (type === 1) {
    const left = 35 + rng() * 30;
    return (
      <div
        className="pushpin absolute pointer-events-none z-10"
        style={{ top: -5, left: `${left}%`, transform: 'translateX(-50%)' }}
      />
    );
  }
  return null;
}

interface PolaroidCardProps {
  image: ImageRecord;
  width: number;
  onDelete: (id: string) => void;
  onDeleteTerm: (imageId: string, termId: string) => void;
  onRetryTerms: (imageId: string) => void;
  isRetrying?: boolean;
}

export function PolaroidCard({
  image, width, onDelete, onDeleteTerm, onRetryTerms, isRetrying,
}: PolaroidCardProps) {
  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const rng = seededRandom(image.id);
  const aspectRatio = 0.65 + rng() * 0.5;
  const imgHeight = Math.round(width * aspectRatio);
  // Distance from card bottom to image bottom = polaroid strip (h-5 = 20px) + padding (8px)
  const termBottom = 20 + 8;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) { onDelete(image.id); }
    else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 2500); }
  };

  return (
    // overflow:visible on the card so TermTag panel can expand freely
    <motion.div
      className="relative bg-white flex-shrink-0 cursor-default rounded-sm"
      style={{ width, overflow: 'visible' }}
      animate={{
        boxShadow: hovered
          ? '0 8px 28px rgba(45,36,22,0.16), 0 2px 6px rgba(45,36,22,0.09)'
          : '0 2px 10px rgba(45,36,22,0.10), 0 1px 2px rgba(45,36,22,0.06)',
        y: hovered ? -3 : 0,
        zIndex: hovered ? 30 : 1,
      }}
      transition={{ duration: 0.18 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false); }}
    >
      <Decoration seed={image.id} />

      {/* White top border */}
      <div className="pt-2 px-2 pb-0">
        {/* Image — overflow:hidden to clip the photo only */}
        <div className="relative overflow-hidden rounded-[1px]" style={{ height: imgHeight }}>
          <img
            src={`/uploads/${image.filePath}`}
            alt="design inspiration"
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {/* Delete */}
          <AnimatePresence>
            {hovered && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleDeleteClick}
                className={cn(
                  'absolute top-1.5 right-1.5 z-20 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-dm shadow transition-colors',
                  confirmDelete ? 'bg-red-500 text-white' : 'bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm'
                )}
              >
                <Trash2 size={8} />
                {confirmDelete ? '确认' : ''}
              </motion.button>
            )}
          </AnimatePresence>

          {/* Retry */}
          {image.terms.length === 0 && (
            <button
              onClick={() => onRetryTerms(image.id)}
              disabled={isRetrying}
              className="absolute bottom-2 left-2 z-20 flex items-center gap-1 px-2 py-1 rounded-full bg-black/25 backdrop-blur-sm font-kalam text-[10px] text-white/90 hover:bg-black/40 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={9} className={isRetrying ? 'animate-spin' : ''} />
              {isRetrying ? '生成中' : '生成术语'}
            </button>
          )}
        </div>
      </div>

      {/* Polaroid white bottom strip */}
      <div className="h-5" />

      {/* TermTag: absolutely positioned over the image area, bottom-left.
          Lives OUTSIDE the overflow:hidden image div so it can expand freely. */}
      {image.terms.length > 0 && (
        <div
          className="absolute left-2 z-30"
          style={{ bottom: termBottom }}
        >
          <TermTag terms={image.terms} imageId={image.id} onDeleteTerm={onDeleteTerm} />
        </div>
      )}
    </motion.div>
  );
}
