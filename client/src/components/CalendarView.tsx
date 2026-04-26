import { useState, useCallback, useRef, useEffect } from 'react';
import { DayCell } from './DayCell';
import { NoteArea } from './NoteArea';
import { useImages, useUploadImage, useDeleteImage, useDeleteTerm, useRetryTerms } from '@/hooks/useImages';
import { useQuota } from '@/hooks/useQuota';
import { dateToStr, addDays } from '@/lib/utils';
import type { ImageRecord } from '@/lib/api';

interface CalendarViewProps {
  startDate: Date;
}

export function CalendarView({ startDate }: CalendarViewProps) {
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(900);

  // Measure container width for responsive column sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  const dates = [
    dateToStr(startDate),
    dateToStr(addDays(startDate, 1)),
    dateToStr(addDays(startDate, 2)),
  ];
  const endDate = addDays(startDate, 2);

  const { data: images = [] } = useImages(startDate, endDate);
  const { data: quota } = useQuota();

  const uploadMutation = useUploadImage();
  const deleteMutation = useDeleteImage();
  const deleteTermMutation = useDeleteTerm();
  const retryMutation = useRetryTerms();

  const imagesByDate = dates.reduce<Record<string, ImageRecord[]>>((acc, d) => {
    acc[d] = images.filter(img => img.date === d);
    return acc;
  }, {});

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

  // Each cell gets 1/3 of container (minus 2 gaps of 16px)
  const cellWidth = Math.floor((containerWidth - 32) / 3);

  return (
    <div className="flex flex-col w-full" ref={containerRef}>
      {/* Day cells row */}
      <div className="flex w-full items-start" style={{ gap: 16, paddingBottom: 16 }}>
        {dates.map((date) => (
          <DayCell
            key={date}
            date={date}
            images={imagesByDate[date] ?? []}
            cellWidth={cellWidth}
            onUpload={handleUpload}
            onDeleteImage={handleDeleteImage}
            onDeleteTerm={handleDeleteTerm}
            onRetryTerms={handleRetryTerms}
            uploadingFor={uploadingFor}
            retryingId={retryingId}
            isDisabled={isDisabled}
          />
        ))}
      </div>

      {/* Notes row */}
      <NoteArea date={startDate} />
    </div>
  );
}
