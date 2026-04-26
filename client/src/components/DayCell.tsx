import { motion } from 'framer-motion';
import { PolaroidCard } from './PolaroidCard';
import { UploadZone } from './UploadZone';
import { strToDate, seededRandom, todayStr, addDays, dateToStr } from '@/lib/utils';
import type { ImageRecord } from '@/lib/api';

const DAY_ABBR = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function splitColumns(images: ImageRecord[]): [ImageRecord[], ImageRecord[]] {
  const left: ImageRecord[] = [];
  const right: ImageRecord[] = [];
  let leftH = 0, rightH = 0;
  for (const img of images) {
    const rng = seededRandom(img.id);
    rng();
    const aspect = 0.65 + rng() * 0.5;
    if (leftH <= rightH) { left.push(img); leftH += aspect; }
    else { right.push(img); rightH += aspect; }
  }
  return [left, right];
}

interface DayCellProps {
  date: string;
  images: ImageRecord[];
  cellWidth: number;
  onUpload: (file: File, date: string) => Promise<void>;
  onDeleteImage: (id: string) => void;
  onDeleteTerm: (imageId: string, termId: string) => void;
  onRetryTerms: (imageId: string) => void;
  uploadingFor?: string | null;
  retryingId?: string | null;
  isDisabled?: boolean;
  isWeekend?: boolean;
}

export function DayCell({
  date, images, cellWidth,
  onUpload, onDeleteImage, onDeleteTerm, onRetryTerms,
  uploadingFor, retryingId, isDisabled, isWeekend,
}: DayCellProps) {
  const d = strToDate(date);
  const today = todayStr();
  const sun = isWeekend ? addDays(d, 1) : null;

  const isSatToday = date === today;
  const isSunToday = sun ? dateToStr(sun) === today : false;
  const isToday = isWeekend ? (isSatToday || isSunToday) : date === today;

  const PADDING = 12;
  const COL_GAP = 8;
  const usable = cellWidth - PADDING * 2;
  const useDual = usable >= 240;
  const cardWidth = useDual ? Math.floor((usable - COL_GAP) / 2) : usable;
  const [leftCol, rightCol] = useDual ? splitColumns(images) : [images, []];

  const renderCard = (img: ImageRecord) => (
    <div key={img.id} style={{ marginTop: 36 }}>
      <PolaroidCard
        image={img}
        width={cardWidth}
        onDelete={onDeleteImage}
        onDeleteTerm={onDeleteTerm}
        onRetryTerms={onRetryTerms}
        isRetrying={retryingId === img.id}
      />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="flex flex-col rounded-xl overflow-hidden"
      style={{ background: '#f4f4f5', minHeight: 200 }}
    >
      {/* Column header — centered date number + day abbreviation */}
      <div className="flex flex-col items-center pt-4 pb-3">
        {isWeekend && sun ? (
          /* Weekend: "25 - 26" on one line, "SAT - SUN" below */
          <>
            <div className="flex items-baseline gap-1">
              <span
                className="leading-none tabular-nums"
                style={{ fontSize: 32, fontWeight: 300, color: isToday ? '#18181b' : '#71717a', letterSpacing: '-0.02em' }}
              >
                {d.getDate()}
              </span>
              <span style={{ fontSize: 20, fontWeight: 300, color: '#a1a1aa' }}>–</span>
              <span
                className="leading-none tabular-nums"
                style={{ fontSize: 32, fontWeight: 300, color: isToday ? '#18181b' : '#71717a', letterSpacing: '-0.02em' }}
              >
                {sun.getDate()}
              </span>
            </div>
            <span className="text-[10px] font-medium tracking-widest mt-1" style={{ color: '#a1a1aa', letterSpacing: '0.12em' }}>
              SAT – SUN
            </span>
          </>
        ) : (
          <>
            <span
              className="leading-none tabular-nums"
              style={{ fontSize: 32, fontWeight: 300, color: isToday ? '#18181b' : '#71717a', letterSpacing: '-0.02em' }}
            >
              {d.getDate()}
            </span>
            <span
              className="text-[10px] font-medium tracking-widest mt-1"
              style={{ color: isToday ? '#18181b' : '#a1a1aa', letterSpacing: '0.12em' }}
            >
              {DAY_ABBR[d.getDay()]}
              {isToday && <span className="ml-1.5 text-[9px] font-normal normal-case tracking-normal" style={{ color: '#71717a' }}>today</span>}
            </span>
          </>
        )}
      </div>

      {/* Divider */}
      <div className="h-px mx-3" style={{ background: '#e4e4e7' }} />

      {/* Cards */}
      <div className="flex-1 px-3 pb-3">
        {useDual ? (
          <div className="flex gap-2">
            <div className="flex flex-col gap-3" style={{ width: cardWidth }}>
              {leftCol.map(renderCard)}
            </div>
            <div className="flex flex-col gap-3" style={{ width: cardWidth, paddingTop: leftCol.length > 0 ? 18 : 0 }}>
              {rightCol.map(renderCard)}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {leftCol.map(renderCard)}
          </div>
        )}

        <div className="mt-3">
          <UploadZone
            date={date}
            onUpload={onUpload}
            isLoading={uploadingFor === date}
            disabled={isDisabled}
          />
        </div>
      </div>
    </motion.div>
  );
}
