import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchNote, saveNote } from '@/lib/api';
import { dateToStr } from '@/lib/utils';

const MIN_HEIGHT = 100;
const MAX_HEIGHT = 480;

interface NoteAreaProps {
  weekStart: Date;
}

export function NoteArea({ weekStart }: NoteAreaProps) {
  const dateStr = dateToStr(weekStart);
  const [height, setHeight] = useState(140);
  const [localContent, setLocalContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const dragStartH = useRef<number>(140);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data } = useQuery({
    queryKey: ['note', dateStr],
    queryFn: () => fetchNote(dateStr),
  });

  useEffect(() => {
    if (data?.content !== undefined) {
      setLocalContent(data.content);
      setIsDirty(false);
    }
  }, [data?.content]);

  const { mutate: save } = useMutation({
    mutationFn: (content: string) => saveNote(dateStr, content),
    onSuccess: () => setIsDirty(false),
  });

  const handleChange = (val: string) => {
    setLocalContent(val);
    setIsDirty(true);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => save(val), 800);
  };

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartY.current = e.clientY;
    dragStartH.current = height;
    const onMove = (ev: MouseEvent) => {
      if (dragStartY.current === null) return;
      const delta = ev.clientY - dragStartY.current;
      setHeight(h => Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, dragStartH.current + delta)));
    };
    const onUp = () => {
      dragStartY.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [height]);

  return (
    <div className="w-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-0.5 mb-2">
        <span className="text-[11px] font-medium text-[#18181b] tracking-wide">Weekly Notes</span>
        {isDirty && <span className="text-[10px] text-[#c4c4c7]">saving...</span>}
      </div>

      {/* Textarea */}
      <div className="relative" style={{ height, background: '#f4f4f5' }}>
        <textarea
          value={localContent}
          onChange={e => handleChange(e.target.value)}
          className="w-full h-full resize-none bg-transparent text-sm text-[#18181b] leading-relaxed outline-none"
          style={{ padding: '12px 14px', caretColor: '#18181b' }}
          placeholder="What happened this week..."
          spellCheck={false}
        />
      </div>

      {/* Drag handle */}
      <div
        className="w-full flex items-center justify-center cursor-s-resize group py-1.5"
        onMouseDown={handleDragStart}
      >
        <div className="w-8 h-0.5 rounded-full bg-[#e4e4e7] group-hover:bg-[#a1a1aa] transition-colors" />
      </div>
    </div>
  );
}
