import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GenerateSkillModalProps {
  markdown: string;
  onClose: () => void;
}

function downloadMarkdown(markdown: string) {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'design-preference-skill.md';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Simple markdown-like renderer for headings, bold, lists, paragraphs
function renderSimpleMarkdown(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('## ')) {
      return (
        <h2 key={i} className="text-base font-semibold text-[#18181b] mt-6 mb-2 first:mt-0 pb-1.5 border-b border-[#e4e4e7]">
          {line.slice(3)}
        </h2>
      );
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <li key={i} className="text-sm text-[#3f3f46] leading-relaxed ml-4 list-disc">
          {line.slice(2)}
        </li>
      );
    }
    if (line.match(/^\*\*(.+?)\*\*/)) {
      // Bold inline
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className="text-sm text-[#3f3f46] leading-relaxed">
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    }
    if (line.trim() === '') {
      return <div key={i} className="h-2" />;
    }
    return (
      <p key={i} className="text-sm text-[#3f3f46] leading-relaxed">
        {line}
      </p>
    );
  });
}

export function GenerateSkillModal({ markdown, onClose }: GenerateSkillModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
        >
          <X size={18} />
        </button>

        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="flex flex-col bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e4e4e7]">
            <h2 className="text-lg font-semibold text-[#18181b]">Your Design Preference Skill</h2>
          </div>

          {/* Body */}
          <div className="flex-1 px-6 py-4 overflow-y-auto">
            {renderSimpleMarkdown(markdown)}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e4e4e7]">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#71717a] hover:text-[#18181b] transition-colors rounded-lg hover:bg-[#f4f4f5]"
            >
              Close
            </button>
            <button
              onClick={() => downloadMarkdown(markdown)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
            >
              Download .md
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
