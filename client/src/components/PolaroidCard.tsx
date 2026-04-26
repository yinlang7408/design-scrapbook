import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, RefreshCw } from 'lucide-react';
import { TermTag } from './TermTag';
import { seededRandom, cn } from '@/lib/utils';
import type { ImageRecord } from '@/lib/api';

// Minimal pin decoration — neutral gray
function Pin({ seed }: { seed: string }) {
  const rng = seededRandom(seed + 'pin');
  const left = 35 + rng() * 30;
  return (
    <div
      className="pushpin absolute pointer-events-none z-10"
      style={{ top: -6, left: `${left}%`, transform: 'translateX(-50%)' }}
    />
  );
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
  const termBottom = 8; // distance from card bottom to TermTag

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) { onDelete(image.id); }
    else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 2500); }
  };

  return (
    <motion.div
      className="relative bg-white flex-shrink-0 cursor-default rounded-lg"
      style={{ width, overflow: 'visible' }}
      animate={{
        boxShadow: hovered
          ? '0 4px 20px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)'
          : '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
        y: hovered ? -2 : 0,
        zIndex: hovered ? 30 : 1,
      }}
      transition={{ duration: 0.16 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false); }}
    >
      <Pin seed={image.id} />

      <div className="p-2 pb-0">
        <div className="relative overflow-hidden rounded-md" style={{ height: imgHeight }}>
          <img
            src={`/uploads/${image.filePath}`}
            alt="design inspiration"
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {/* Delete button */}
          <AnimatePresence>
            {hovered && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleDeleteClick}
                className={cn(
                  'absolute top-1.5 right-1.5 z-20 w-6 h-6 flex items-center justify-center rounded-full text-white shadow transition-colors',
                  confirmDelete ? 'bg-red-500' : 'bg-black/40 hover:bg-red-500 backdrop-blur-sm'
                )}
              >
                <Trash2 size={10} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Retry terms */}
          {image.terms.length === 0 && (
            <button
              onClick={() => onRetryTerms(image.id)}
              disabled={isRetrying}
              className="absolute bottom-2 left-2 z-20 flex items-center gap-1 px-2 py-1 rounded-full bg-white/80 backdrop-blur-sm text-[10px] text-[#18181b] hover:bg-white transition-colors disabled:opacity-50 shadow-sm"
            >
              <RefreshCw size={9} className={isRetrying ? 'animate-spin' : ''} />
              {isRetrying ? 'Generating…' : 'Get terms'}
            </button>
          )}
        </div>
      </div>

      {/* Bottom strip */}
      <div className="h-6" />

      {/* Term tag */}
      {image.terms.length > 0 && (
        <div className="absolute left-2 z-30" style={{ bottom: termBottom }}>
          <TermTag terms={image.terms} imageId={image.id} onDeleteTerm={onDeleteTerm} />
        </div>
      )}
    </motion.div>
  );
}
