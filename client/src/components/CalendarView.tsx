import { useState, useCallback, useRef, useEffect } from 'react';
import { DayCell } from './DayCell';
import { useImages, useUploadImage, useDeleteImage, useDeleteTerm } from '@/hooks/useImages';
import { useQuota } from '@/hooks/useQuota';
import { dateToStr, addDays, todayStr } from '@/lib/utils';
import type { ImageRecord } from '@/lib/api';

interface CalendarViewProps {
  weekStart: Date; // always Monday
}

export function CalendarView({ weekStart }: CalendarViewProps) {
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
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
    uploadingFor,
    isDisabled,
  };

  return (
    <div className="flex flex-col w-full" ref={containerRef}>
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
