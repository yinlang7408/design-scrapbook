import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NavBar } from './components/NavBar';
import { CalendarView } from './components/CalendarView';
import { NoteArea } from './components/NoteArea';
import { QuotaBanner } from './components/QuotaBanner';
import { GenerateSkillModal } from './components/GenerateSkillModal';
import { SelectionPanel } from './components/SelectionPanel';
import { useFingerprint } from './hooks/useFingerprint';
import { SelectionProvider, useSelectionContext } from './hooks/useSelection';
import { dateToStr, getWeekStart, addDays } from './lib/utils';
import { generateDesignSkill, getApiErrorMessage } from './lib/api';

function AppContent() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [notice, setNotice] = useState<{ tone: 'warning' | 'error'; message: string } | null>(null);
  const [skillMarkdown, setSkillMarkdown] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const {
    selectedIds, exitSelectionMode, setGenerating,
    toggleImage, isGenerating,
  } = useSelectionContext();

  const goNext = useCallback(() => setWeekStart(d => addDays(d, 7)), []);
  const goPrev = useCallback(() => setWeekStart(d => addDays(d, -7)), []);
  const goToday = useCallback(() => setWeekStart(getWeekStart(new Date())), []);

  const isCurrentWeek = dateToStr(weekStart) === dateToStr(getWeekStart(new Date()));

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      const result = await generateDesignSkill(Array.from(selectedIds));
      setSkillMarkdown(result.markdown);
      setPanelOpen(false);
      exitSelectionMode();
    } catch (error) {
      setNotice({
        tone: 'error',
        message: getApiErrorMessage(error, 'Failed to generate design skill'),
      });
    } finally {
      setGenerating(false);
    }
  }, [selectedIds, setGenerating, exitSelectionMode]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <NavBar
        weekStart={weekStart}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        isCurrentWeek={isCurrentWeek}
        onOpenSelect={() => setPanelOpen(true)}
      />
      <QuotaBanner />

      {notice && (
        <div className="max-w-5xl w-full mx-auto px-6 pt-3">
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <span>{notice.message}</span>
            <button
              onClick={() => setNotice(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={dateToStr(weekStart)}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.20, ease: 'easeOut' }}
          className="max-w-5xl w-full mx-auto px-6 pt-6 pb-16 flex flex-col gap-5"
        >
          <div style={{ background: '#f4f4f5' }}>
            <CalendarView weekStart={weekStart} />
          </div>

          <NoteArea weekStart={weekStart} />
        </motion.div>
      </AnimatePresence>

      <SelectionPanel
        open={panelOpen}
        selectedIds={selectedIds}
        isGenerating={isGenerating}
        onToggle={toggleImage}
        onGenerate={handleGenerate}
        onClose={() => { setPanelOpen(false); exitSelectionMode(); }}
      />

      {skillMarkdown && (
        <GenerateSkillModal
          markdown={skillMarkdown}
          onClose={() => setSkillMarkdown(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  const uid = useFingerprint();

  if (!uid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="text-sm text-[#a1a1aa] animate-pulse">Loading…</span>
      </div>
    );
  }

  return (
    <SelectionProvider>
      <AppContent />
    </SelectionProvider>
  );
}
