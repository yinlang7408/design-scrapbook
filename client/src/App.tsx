import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NavBar } from './components/NavBar';
import { CalendarView } from './components/CalendarView';
import { QuotaBanner } from './components/QuotaBanner';
import { useFingerprint } from './hooks/useFingerprint';
import { addDays, dateToStr } from './lib/utils';

function getStartOfPeriod(date: Date): Date {
  // Snap to 3-day periods starting from 2024-01-01
  const epoch = new Date(2024, 0, 1);
  const daysDiff = Math.floor((date.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24));
  const periodIndex = Math.floor(daysDiff / 3);
  const startDay = new Date(epoch);
  startDay.setDate(startDay.getDate() + periodIndex * 3);
  return startDay;
}

export default function App() {
  const uid = useFingerprint();
  const [currentStart, setCurrentStart] = useState(() => getStartOfPeriod(new Date()));

  const endDate = addDays(currentStart, 2);

  const goNext = useCallback(() => setCurrentStart(d => addDays(d, 3)), []);
  const goPrev = useCallback(() => setCurrentStart(d => addDays(d, -3)), []);
  const goToday = useCallback(() => setCurrentStart(getStartOfPeriod(new Date())), []);

  const today = getStartOfPeriod(new Date());
  const isCurrentPeriod = dateToStr(currentStart) === dateToStr(today);

  if (!uid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="font-caveat text-ink-light text-lg animate-pulse">正在初始化...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar
        startDate={currentStart}
        endDate={endDate}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        isCurrentPeriod={isCurrentPeriod}
      />
      <QuotaBanner />

      <main className="flex-1 max-w-5xl w-full mx-auto pt-6 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={dateToStr(currentStart)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <CalendarView startDate={currentStart} />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 border-t border-dashed border-ink/8">
        <span className="font-kalam text-[10px] text-ink/25">
          每日限额 80¢ · 每人上限 200 张 · 图片与术语自动保存
        </span>
      </footer>
    </div>
  );
}
