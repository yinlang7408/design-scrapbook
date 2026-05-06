import { useState, useCallback, useRef, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { DayCell } from './DayCell';
import { useImages, useUploadImage, useDeleteImage, useDeleteTerm, useRetryTerms } from '@/hooks/useImages';
import { useQuota } from '@/hooks/useQuota';
import { cn, dateToStr, addDays, todayStr } from '@/lib/utils';
import { getApiErrorMessage, type ImageRecord } from '@/lib/api';

interface CalendarViewProps {
  weekStart: Date; // always Monday
}

export function CalendarView({ weekStart }: CalendarViewProps) {
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [retryingImageId, setRetryingImageId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'warning' | 'error'; message: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(960);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  // Mon=0 ... Fri=4, Sat=5, Sun=6
  const weekDates = Array.from({ length: 7 }, (_, i) => dateToStr(addDays(weekStart, i)));
  const [mon, tue, wed, thu, fri, sat, sun] = weekDates;
  const weekEnd = addDays(weekStart, 6);

  const { data: images = [] } = useImages(weekStart, weekEnd);
  const { data: quota } = useQuota();

  const uploadMutation = useUploadImage();
  const deleteMutation = useDeleteImage();
  const deleteTermMutation = useDeleteTerm();
  const retryTermsMutation = useRetryTerms();

  const imagesByDate = weekDates.reduce<Record<string, ImageRecord[]>>((acc, d) => {
    acc[d] = images.filter(img => img.date === d);
    return acc;
  }, {});

  // Weekend cell shows both Sat + Sun images, uploads go to Saturday
  const weekendImages = [...(imagesByDate[sat] ?? []), ...(imagesByDate[sun] ?? [])];

  const isDisabled = quota ? (quota.daily.remaining <= 0 || !quota.user.allowed) : false;

  const handleUpload = useCallback(async (file: File, date: string) => {
    if (isDisabled) {
      setNotice({
        tone: 'warning',
        message: '当前额度已用完，暂时不能继续上传。',
      });
      return;
    }

    setUploadingFor(date);
    try {
      const result = await uploadMutation.mutateAsync({ file, date });

      if (result.termsError) {
        setNotice({
          tone: 'warning',
          message: '图片已上传，但 AI 标签生成失败了。你可以点卡片下方的 Generate tags 再试一次。',
        });
      } else {
        setNotice(null);
      }
    } catch (error) {
      setNotice({
        tone: 'error',
        message: getApiErrorMessage(error, '上传失败，请稍后再试。'),
      });
    } finally {
      setUploadingFor(null);
    }
  }, [isDisabled, uploadMutation]);

  const handleDeleteImage = useCallback((id: string) => deleteMutation.mutate(id), [deleteMutation]);
  const handleDeleteTerm = useCallback((imageId: string, termId: string) => {
    deleteTermMutation.mutate({ imageId, termId });
  }, [deleteTermMutation]);
  const handleRetryTerms = useCallback(async (imageId: string) => {
    setRetryingImageId(imageId);
    try {
      const result = await retryTermsMutation.mutateAsync(imageId);
      if (result.terms.length === 0) {
        setNotice({
          tone: 'warning',
          message: '这张图暂时还没生成出标签，你可以稍后再试一次。',
        });
      } else {
        setNotice(null);
      }
    } catch (error) {
      setNotice({
        tone: 'error',
        message: getApiErrorMessage(error, '重新生成标签失败，请稍后再试。'),
      });
    } finally {
      setRetryingImageId(null);
    }
  }, [retryTermsMutation]);

  // Global paste always goes to today
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items ?? []);
      const imageItem = items.find(i => i.type.startsWith('image/'));
      if (!imageItem) return;
      const file = imageItem.getAsFile();
      if (!file) return;
      handleUpload(file, todayStr());
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleUpload]);

  // Each cell = containerWidth / 3
  const cellWidth = Math.floor(containerWidth / 3);

  const commonProps = {
    cellWidth,
    onUpload: handleUpload,
    onDeleteImage: handleDeleteImage,
    onDeleteTerm: handleDeleteTerm,
    onRetryTerms: handleRetryTerms,
    uploadingFor,
    retryingImageId,
    isDisabled,
  };

  return (
    <div className="flex flex-col w-full" ref={containerRef}>
      {notice && (
        <div
          className={cn(
            'mb-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs',
            notice.tone === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          )}
        >
          <AlertCircle size={14} className="flex-shrink-0" />
          <span className="flex-1">{notice.message}</span>
          <button
            onClick={() => setNotice(null)}
            className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-black/5 transition-colors"
            aria-label="Dismiss message"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Row 1: Mon / Tue / Wed */}
      <div className="grid grid-cols-3 items-stretch">
        <DayCell date={mon} images={imagesByDate[mon] ?? []} {...commonProps} />
        <DayCell date={tue} images={imagesByDate[tue] ?? []} borderLeft {...commonProps} />
        <DayCell date={wed} images={imagesByDate[wed] ?? []} borderLeft {...commonProps} />
      </div>

      {/* Row 2: Thu / Fri / Weekend */}
      <div className="grid grid-cols-3 items-stretch">
        <DayCell date={thu} images={imagesByDate[thu] ?? []} borderTop {...commonProps} />
        <DayCell date={fri} images={imagesByDate[fri] ?? []} borderLeft borderTop {...commonProps} />
        <DayCell date={sat} images={weekendImages} isWeekend borderLeft borderTop {...commonProps} />
      </div>

    </div>
  );
}
