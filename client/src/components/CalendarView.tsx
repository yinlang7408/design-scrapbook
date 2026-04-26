import { useState, useCallback, useRef, useEffect } from 'react';
import { DayCell } from './DayCell';
import { NoteArea } from './NoteArea';
import { useImages, useUploadImage, useDeleteImage, useDeleteTerm, useRetryTerms } from '@/hooks/useImages';
import { useQuota } from '@/hooks/useQuota';
import { dateToStr, addDays } from '@/lib/utils';
import type { ImageRecord } from '@/lib/api';

interface CalendarViewProps {
  weekStart: Date; // always Monday
}

export function CalendarView({ weekStart }: CalendarViewProps) {
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
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
  const retryMutation = useRetryTerms();

  const imagesByDate = weekDates.reduce<Record<string, ImageRecord[]>>((acc, d) => {
    acc[d] = images.filter(img => img.date === d);
    return acc;
  }, {});

  // Weekend cell shows both Sat + Sun images, uploads go to Saturday
  const weekendImages = [...(imagesByDate[sat] ?? []), ...(imagesByDate[sun] ?? [])];

  const isDisabled = quota ? (quota.daily.remaining <= 0 || !quota.user.allowed) : false;

  const handleUpload = useCallback(async (file: File, date: string) => {
    setUploadingFor(date);
    try { await uploadMutation.mutateAsync({ file, date }); }
    finally { setUploadingFor(null); }
  }, [uploadMutation]);

  const handleDeleteImage = useCallback((id: string) => deleteMutation.mutate(id), [deleteMutation]);
  const handleDeleteTerm = useCallback((imageId: string, termId: string) => {
    deleteTermMutation.mutate({ imageId, termId });
  }, [deleteTermMutation]);

  const handleRetryTerms = useCallback(async (imageId: string) => {
    setRetryingId(imageId);
    try { await retryMutation.mutateAsync(imageId); }
    finally { setRetryingId(null); }
  }, [retryMutation]);

  // Each cell = (containerWidth - 2 gaps) / 3
  const GAP = 16;
  const cellWidth = Math.floor((containerWidth - GAP * 2) / 3);

  const commonProps = {
    cellWidth,
    onUpload: handleUpload,
    onDeleteImage: handleDeleteImage,
    onDeleteTerm: handleDeleteTerm,
    onRetryTerms: handleRetryTerms,
    uploadingFor,
    retryingId,
    isDisabled,
  };

  return (
    <div className="flex flex-col w-full gap-4" ref={containerRef}>
      {/* Row 1: Mon / Tue / Wed */}
      <div className="grid grid-cols-3 gap-4">
        <DayCell date={mon} images={imagesByDate[mon] ?? []} {...commonProps} />
        <DayCell date={tue} images={imagesByDate[tue] ?? []} {...commonProps} />
        <DayCell date={wed} images={imagesByDate[wed] ?? []} {...commonProps} />
      </div>

      {/* Row 2: Thu / Fri / Weekend (merged) */}
      <div className="grid grid-cols-3 gap-4">
        <DayCell date={thu} images={imagesByDate[thu] ?? []} {...commonProps} />
        <DayCell date={fri} images={imagesByDate[fri] ?? []} {...commonProps} />
        <DayCell
          date={sat}
          images={weekendImages}
          isWeekend
          {...commonProps}
        />
      </div>

      {/* Row 3: Full-width note area */}
      <NoteArea weekStart={weekStart} />
    </div>
  );
}
