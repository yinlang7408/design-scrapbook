import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { ImageRecord } from '@/lib/api';

interface LightboxProps {
  image: ImageRecord | null;
  onClose: () => void;
}

export function Lightbox({ image, onClose }: LightboxProps) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (!image) return;
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [image, handleKey]);

  return (
    <AnimatePresence>
      {image && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X size={18} />
          </button>

          {/* Image */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="flex flex-col items-center gap-4 max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`/uploads/${image.filePath}`}
              alt="design inspiration"
              className="max-w-full max-h-[72vh] object-contain rounded-lg shadow-2xl"
            />

            {/* Terms */}
            {image.terms.length > 0 && (
              <div
                className="flex flex-wrap items-center justify-center gap-2 px-5 py-3 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {image.terms.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.18)' }}
                  >
                    <span className="text-sm font-medium text-white leading-tight">{t.termEn}</span>
                    <span className="text-xs text-white/60">{t.termZh}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
