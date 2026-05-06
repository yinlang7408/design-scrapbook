import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NavBar } from './components/NavBar';
import { CalendarView } from './components/CalendarView';
import { NoteArea } from './components/NoteArea';
import { QuotaBanner } from './components/QuotaBanner';
import { useFingerprint } from './hooks/useFingerprint';
import { dateToStr, getWeekStart, addDays } from './lib/utils';

export default function App() {
  const uid = useFingerprint();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  const goNext = useCallback(() => setWeekStart(d => addDays(d, 7)), []);
  const goPrev = useCallback(() => setWeekStart(d => addDays(d, -7)), []);
  const goToday = useCallback(() => setWeekStart(getWeekStart(new Date())), []);

  const isCurrentWeek = dateToStr(weekStart) === dateToStr(getWeekStart(new Date()));

  if (!uid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="text-sm text-[#a1a1aa] animate-pulse">Loading…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <NavBar
        weekStart={weekStart}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        isCurrentWeek={isCurrentWeek}
      />
      <QuotaBanner />

      <AnimatePresence mode="wait">
        <motion.div
          key={dateToStr(weekStart)}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.20, ease: 'easeOut' }}
          className="max-w-5xl w-full mx-auto px-6 pt-6 pb-16 flex flex-col gap-5"
        >
          {/* Gray board — no border, just background */}
          <div style={{ background: '#f4f4f5' }}>
            <CalendarView weekStart={weekStart} />
          </div>

          {/* Notes panel */}
          <NoteArea weekStart={weekStart} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
