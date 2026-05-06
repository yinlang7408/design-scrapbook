import { motion } from 'framer-motion';
import { PolaroidCard } from './PolaroidCard';
import { UploadZone } from './UploadZone';
import { strToDate, seededRandom, todayStr, addDays, dateToStr } from '@/lib/utils';
import type { ImageRecord } from '@/lib/api';

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  uploadingFor?: string | null;
  isDisabled?: boolean;
  isWeekend?: boolean;
  borderLeft?: boolean;
  borderTop?: boolean;
}

export function DayCell({
  date, images, cellWidth,
  onUpload, onDeleteImage, onDeleteTerm,
  uploadingFor, isDisabled, isWeekend,
  borderLeft, borderTop,
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

  const renderCard = (img: ImageRecord, i: number) => (
    <div key={img.id} style={{ marginTop: i === 0 ? 28 : 12 }}>
      <PolaroidCard
        image={img}
        width={cardWidth}
        onDelete={onDeleteImage}
        onDeleteTerm={onDeleteTerm}
      />
    </div>
  );

  const isEmpty = images.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="flex flex-col"
      style={{ minHeight: 200 }}
    >
      {/* Date header — always visible */}
      <div className="flex flex-col items-center pt-4 pb-3">
        {isWeekend && sun ? (
          <div className="flex flex-col items-center">
            <span className="leading-none tabular-nums" style={{ fontSize: 13, fontWeight: 400, color: isToday ? '#18181b' : '#a1a1aa', letterSpacing: '0.04em' }}>{MONTH_ABBR[d.getMonth()]}</span>
            <div className="flex items-baseline gap-0.5 mt-0.5">
              <span className="leading-none tabular-nums" style={{ fontSize: 28, fontWeight: 300, color: isToday ? '#18181b' : '#71717a', letterSpacing: '-0.02em' }}>{d.getDate()}</span>
              <span style={{ fontSize: 16, fontWeight: 300, color: '#d4d4d8' }}>–</span>
              <span className="leading-none tabular-nums" style={{ fontSize: 28, fontWeight: 300, color: isToday ? '#18181b' : '#71717a', letterSpacing: '-0.02em' }}>{sun.getDate()}</span>
            </div>
            <span className="text-[10px] font-medium mt-1" style={{ color: isToday ? '#18181b' : '#a1a1aa', letterSpacing: '0.08em' }}>
              {isToday ? 'today' : 'SAT – SUN'}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="leading-none tabular-nums" style={{ fontSize: 13, fontWeight: 400, color: isToday ? '#18181b' : '#a1a1aa', letterSpacing: '0.04em' }}>{MONTH_ABBR[d.getMonth()]}</span>
            <span className="leading-none tabular-nums mt-0.5" style={{ fontSize: 28, fontWeight: 300, color: isToday ? '#18181b' : '#71717a', letterSpacing: '-0.02em' }}>{d.getDate()}</span>
            <span className="text-[10px] font-medium mt-1" style={{ color: isToday ? '#18181b' : '#a1a1aa', letterSpacing: '0.08em' }}>
              {isToday ? 'today' : DAY_ABBR[d.getDay()]}
            </span>
          </div>
        )}
      </div>

      {/* Content: cards or upload zone */}
      <div className="flex-1 flex flex-col px-3 pb-3" style={{ borderLeft: borderLeft ? '1px solid #e4e4e7' : undefined, borderTop: borderTop ? '1px solid #e4e4e7' : undefined }}>
        {isEmpty ? (
          <div className="pt-7">
            <UploadZone
              date={date}
              onUpload={onUpload}
              isLoading={uploadingFor === date}
              disabled={isDisabled}
            />
          </div>
        ) : (
          useDual ? (
            <div className="flex gap-2 items-start">
              <div className="flex flex-col" style={{ width: cardWidth }}>{leftCol.map((img, i) => renderCard(img, i))}</div>
              <div className="flex flex-col" style={{ width: cardWidth }}>{rightCol.map((img, i) => renderCard(img, i))}</div>
            </div>
          ) : (
            <div className="flex flex-col">{leftCol.map((img, i) => renderCard(img, i))}</div>
          )
        )}
      </div>
    </motion.div>
  );
}
