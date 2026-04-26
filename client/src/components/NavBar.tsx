import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { formatDateRange, addDays } from '@/lib/utils';

interface NavBarProps {
  startDate: Date;
  endDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  isCurrentPeriod: boolean;
}

export function NavBar({ startDate, endDate, onPrev, onNext, onToday, isCurrentPeriod }: NavBarProps) {
  return (
    <header className="sticky top-0 z-50 w-full" style={{ backgroundColor: 'rgba(250,248,245,0.92)', backdropFilter: 'blur(8px)' }}>
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4">
        {/* Logo / title */}
        <div className="flex items-center gap-2 mr-auto">
          <BookOpen size={16} className="text-ink/40" />
          <span className="font-caveat text-xl text-ink font-semibold tracking-wide">设计手帐</span>
          <span className="font-kalam text-[10px] text-ink-light opacity-50 ml-1">Design Journal</span>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-ink/8 text-ink-light transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={onToday}
            className="font-caveat text-base text-ink leading-none hover:text-ink-light transition-colors px-2 py-1 rounded hover:bg-ink/5"
          >
            {formatDateRange(startDate, endDate)}
          </button>

          <button
            onClick={onNext}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-ink/8 text-ink-light transition-colors"
          >
            <ChevronRight size={16} />
          </button>

          {!isCurrentPeriod && (
            <button
              onClick={onToday}
              className="font-kalam text-[10px] px-2 py-1 rounded-full border border-ink/15 text-ink-light hover:border-ink/30 transition-colors ml-1"
            >
              回到今天
            </button>
          )}
        </div>
      </div>

      {/* Subtle bottom rule */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-ink/8 to-transparent" />
    </header>
  );
}
