import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { TermTag } from './TermTag';
import { seededRandom } from '@/lib/utils';
import type { ImageRecord } from '@/lib/api';

// Warm, design-board pin colors
const PIN_COLORS = [
  { body: '#e85d4a', shine: '#f28b7d' }, // coral red
  { body: '#f5a623', shine: '#fbc86a' }, // amber
  { body: '#4a90d9', shine: '#7db8f0' }, // sky blue
  { body: '#7b68ee', shine: '#a99cf5' }, // lavender
  { body: '#50c878', shine: '#88dfa8' }, // mint green
];

function Pin({ seed }: { seed: string }) {
  const rng = seededRandom(seed + 'pin');
  const left = 30 + rng() * 40;
  const colorIdx = Math.floor(rng() * PIN_COLORS.length);
  const { body, shine } = PIN_COLORS[colorIdx];
  return (
    <div
      className="absolute pointer-events-none z-10"
      style={{
        top: -7,
        left: `${left}%`,
        transform: 'translateX(-50%)',
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 32%, ${shine}, ${body})`,
        boxShadow: `0 2px 5px rgba(0,0,0,0.28), inset 0 1px 2px rgba(255,255,255,0.35)`,
      }}
    />
  );
}

interface PolaroidCardProps {
  image: ImageRecord;
  width: number;
  onDelete: (id: string) => void;
  onDeleteTerm: (imageId: string, termId: string) => void;
  onRetryTerms?: (id: string) => void;
  onImageClick?: (image: ImageRecord) => void;
  isRetryingTerms?: boolean;
}

export function PolaroidCard({
  image, width, onDelete, onDeleteTerm, onRetryTerms, onImageClick, isRetryingTerms,
}: PolaroidCardProps) {
  const [hovered, setHovered] = useState(false);

  const rng = seededRandom(image.id);
  const aspectRatio = 0.65 + rng() * 0.5;
  const imgHeight = Math.round(width * aspectRatio);
  const termBottom = 8;

  return (
    <motion.div
      className="relative bg-white flex-shrink-0 cursor-default"
      style={{ width, overflow: 'visible', borderRadius: 0 }}
      animate={{
        boxShadow: hovered
          ? '0 4px 20px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.07)'
          : '0 1px 4px rgba(0,0,0,0.09), 0 1px 2px rgba(0,0,0,0.05)',
        y: hovered ? -2 : 0,
        zIndex: hovered ? 30 : 1,
      }}
      transition={{ duration: 0.16 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Pin seed={image.id} />

      <div className="p-2 pb-0">
        <div
          className="relative overflow-hidden cursor-pointer"
          style={{ height: imgHeight, borderRadius: 0 }}
          onClick={() => onImageClick?.(image)}
        >
          <img
            src={`/uploads/${image.filePath}`}
            alt="design inspiration"
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {/* Delete — single click, shown on hover */}
          <AnimatePresence>
            {hovered && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => { e.stopPropagation(); onDelete(image.id); }}
                className="absolute top-1.5 right-1.5 z-20 w-6 h-6 flex items-center justify-center rounded-full bg-black/35 hover:bg-red-500 backdrop-blur-sm text-white shadow transition-colors"
              >
                <Trash2 size={10} />
              </motion.button>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Bottom strip */}
      {image.terms.length === 0 && onRetryTerms ? (
        <div className="px-2 pt-1 pb-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRetryTerms(image.id);
            }}
            disabled={isRetryingTerms}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] text-[#3f3f46] bg-[#f4f4f5] hover:bg-[#e4e4e7] transition-colors disabled:opacity-70 disabled:cursor-wait"
          >
            {isRetryingTerms ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <RefreshCw size={11} />
            )}
            <span>{isRetryingTerms ? 'Generating…' : 'Generate tags'}</span>
          </button>
        </div>
      ) : (
        <div className="h-6" />
      )}

      {image.terms.length > 0 && (
        <div className="absolute left-2 z-30" style={{ bottom: termBottom }} onClick={(e) => e.stopPropagation()}>
          <TermTag terms={image.terms} imageId={image.id} onDeleteTerm={onDeleteTerm} />
        </div>
      )}
    </motion.div>
  );
}
