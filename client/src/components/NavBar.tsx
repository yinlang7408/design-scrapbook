import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { getWeekNumber, addDays } from '@/lib/utils';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatHeader(weekStart: Date): { week: string; range: string } {
  const weekEnd = addDays(weekStart, 6);
  const weekNum = getWeekNumber(weekStart);
  const startMonth = MONTH_NAMES[weekStart.getMonth()];
  const endMonth = MONTH_NAMES[weekEnd.getMonth()];
  const range = startMonth === endMonth
    ? `${startMonth} ${weekStart.getDate()} - ${weekEnd.getDate()}`
    : `${startMonth} ${weekStart.getDate()} - ${endMonth} ${weekEnd.getDate()}`;
  return { week: `Week ${weekNum}`, range };
}

interface NavBarProps {
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  isCurrentWeek: boolean;
  onOpenSelect: () => void;
}

export function NavBar({ weekStart, onPrev, onNext, onToday, isCurrentWeek, onOpenSelect }: NavBarProps) {
  const { week, range } = formatHeader(weekStart);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-[#e4e4e7]">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
        <button
          onClick={onToday}
          className="mr-auto text-xl font-semibold text-[#18181b] hover:opacity-70 transition-opacity"
        >
          设计手帐
        </button>

        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToday}
            className="flex items-center gap-3 min-w-0 hover:opacity-70 transition-opacity"
          >
            <span className="text-lg font-semibold text-[#18181b] whitespace-nowrap">{week}</span>
            <span className="text-[#71717a] text-sm font-normal">|</span>
            <span className="text-[#71717a] text-sm font-normal truncate">{range}</span>
          </button>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onPrev}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f4f4f5] text-[#71717a] transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={onNext}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f4f4f5] text-[#71717a] transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={onOpenSelect}
            className="ml-2 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#e4e4e7] text-[#71717a] hover:bg-[#f4f4f5] transition-colors"
            title="Select images"
          >
            <Layers size={13} />
            Select
          </button>
          {!isCurrentWeek && (
            <button
              onClick={onToday}
              className="ml-1 text-xs px-3 py-1.5 rounded-lg border border-[#e4e4e7] text-[#71717a] hover:bg-[#f4f4f5] transition-colors"
            >
              Today
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
