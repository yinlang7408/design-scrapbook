import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllImages, type ImageRecord } from '@/lib/api';

interface SelectionPanelProps {
  open: boolean;
  selectedIds: Set<string>;
  isGenerating: boolean;
  onToggle: (id: string) => void;
  onGenerate: () => void;
  onClose: () => void;
}

export function SelectionPanel({
  open, selectedIds, isGenerating, onToggle, onGenerate, onClose,
}: SelectionPanelProps) {
  const { data: allImages = [] } = useQuery({
    queryKey: ['images', 'all'],
    queryFn: fetchAllImages,
    enabled: open,
  });

  // Group by date
  const grouped = allImages.reduce<Record<string, ImageRecord[]>>((acc, img) => {
    (acc[img.date] ??= []).push(img);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed top-0 right-0 bottom-0 z-50 w-80 bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4e4e7]">
              <div>
                <h2 className="text-sm font-semibold text-[#18181b]">Select Images</h2>
                <span className="text-xs text-[#a1a1aa]">{selectedIds.size} selected</span>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f4f4f5] text-[#71717a] transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {allImages.length === 0 ? (
                <p className="text-xs text-[#a1a1aa] text-center mt-12">No images yet</p>
              ) : (
                sortedDates.map(date => (
                  <div key={date} className="mb-3">
                    <div className="text-[10px] font-medium text-[#a1a1aa] px-2 mb-1.5 uppercase tracking-wider">
                      {date}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {grouped[date].map(img => {
                        const selected = selectedIds.has(img.id);
                        return (
                          <button
                            key={img.id}
                            onClick={() => onToggle(img.id)}
                            className="relative aspect-square rounded-lg overflow-hidden border-2 transition-all"
                            style={{
                              borderColor: selected ? '#6366f1' : 'transparent',
                            }}
                          >
                            <img
                              src={`/uploads/${img.filePath}`}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            {selected && (
                              <div className="absolute inset-0 bg-indigo-500/20" />
                            )}
                            {selected && (
                              <div className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-indigo-600 shadow">
                                <CheckCircle size={10} className="text-white" fill="white" />
                              </div>
                            )}
                            {selected && (
                              <div className="absolute bottom-0 left-0 right-0 bg-indigo-600/90 px-1 py-0.5">
                                <span className="text-[7px] text-white font-medium truncate block text-center leading-none">
                                  {img.terms[0]?.termEn ?? 'untitled'}
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[#e4e4e7]">
              <button
                onClick={onGenerate}
                disabled={selectedIds.size === 0 || isGenerating}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
              >
                {isGenerating ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles size={15} />
                )}
                {isGenerating ? 'Generating…' : 'Generate Design Skill'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
