import { useRef } from 'react';
import { motion } from 'framer-motion';
import { PolaroidCard } from './PolaroidCard';
import { UploadZone } from './UploadZone';
import { strToDate, seededRandom } from '@/lib/utils';
import type { ImageRecord } from '@/lib/api';

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];
const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

// Masonry-like layout: split images into two columns by assigning
// images alternately, biased by their seeded "height" so columns stay balanced.
function splitColumns(images: ImageRecord[]): [ImageRecord[], ImageRecord[]] {
  const left: ImageRecord[] = [];
  const right: ImageRecord[] = [];
  let leftH = 0;
  let rightH = 0;

  for (const img of images) {
    const rng = seededRandom(img.id);
    rng(); // skip rotation seed
    const aspect = 0.65 + rng() * 0.5;
    if (leftH <= rightH) { left.push(img); leftH += aspect; }
    else { right.push(img); rightH += aspect; }
  }
  return [left, right];
}

interface DayCellProps {
  date: string;
  images: ImageRecord[];
  cellWidth: number;              // px — passed from CalendarView
  onUpload: (file: File, date: string) => Promise<void>;
  onDeleteImage: (id: string) => void;
  onDeleteTerm: (imageId: string, termId: string) => void;
  onRetryTerms: (imageId: string) => void;
  uploadingFor?: string | null;
  retryingId?: string | null;
  isDisabled?: boolean;
  isEmpty?: boolean;
}

export function DayCell({
  date, images, cellWidth,
  onUpload, onDeleteImage, onDeleteTerm, onRetryTerms,
  uploadingFor, retryingId, isDisabled, isEmpty,
}: DayCellProps) {
  const d = strToDate(date);
  const dayName = DAY_NAMES[d.getDay()];
  const monthName = MONTH_NAMES[d.getMonth()];
  const dayNum = d.getDate();
  const isToday = new Date().toISOString().slice(0, 10) === date;

  if (isEmpty) return <div className="flex-1 min-w-0" />;

  // Decide single vs dual column based on available width
  // Gap between columns: 8px. Card padding/margin: ~16px total horizontal
  const PADDING = 16;
  const COL_GAP = 8;
  const usable = cellWidth - PADDING * 2;
  const useDual = usable >= 260; // dual column if cell is wide enough
  const cardWidth = useDual ? Math.floor((usable - COL_GAP) / 2) : usable;

  const [leftCol, rightCol] = useDual ? splitColumns(images) : [images, []];

  // Extra top margin per card so the term tag floating above has room
  const CARD_TOP_MARGIN = 40;

  const renderCard = (img: ImageRecord) => (
    <div key={img.id} style={{ marginTop: CARD_TOP_MARGIN }}>
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="flex-1 min-w-0 flex flex-col"
      style={{ minWidth: 0 }}
    >
      {/* Date header */}
      <div className="flex items-center gap-2 mb-1 px-4">
        <span
          className="font-caveat leading-none"
          style={{ fontSize: 28, color: isToday ? '#2d2416' : '#9a8878', fontWeight: isToday ? 700 : 400 }}
        >
          {monthName}{dayNum}日
        </span>
        <span className="font-caveat text-sm opacity-50" style={{ color: '#9a8878' }}>周{dayName}</span>
        {isToday && (
          <span className="font-kalam text-[9px] px-1.5 py-0.5 rounded-full bg-ink/8 text-ink-light">今天</span>
        )}
      </div>

      {/* Cards area */}
      <div className="px-4 flex-1">
        {useDual ? (
          /* Two-column masonry */
          <div className="flex gap-2">
            <div className="flex flex-col gap-3" style={{ width: cardWidth }}>
              {leftCol.map(renderCard)}
            </div>
            <div className="flex flex-col gap-3" style={{ width: cardWidth, paddingTop: leftCol.length > 0 ? 24 : 0 }}>
              {rightCol.map(renderCard)}
            </div>
          </div>
        ) : (
          /* Single column */
          <div className="flex flex-col gap-3">
            {leftCol.map(renderCard)}
          </div>
        )}

        {/* Upload zone */}
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
