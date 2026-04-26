import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchNote, saveNote } from '@/lib/api';
import { dateToStr } from '@/lib/utils';

const MIN_HEIGHT = 80;
const MAX_HEIGHT = 480;

interface NoteAreaProps {
  weekStart: Date;
}

export function NoteArea({ weekStart }: NoteAreaProps) {
  const dateStr = dateToStr(weekStart);
  const [height, setHeight] = useState(120);
  const [localContent, setLocalContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const dragStartH = useRef<number>(120);
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
      const delta = dragStartY.current - ev.clientY;
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
    <div className="w-full flex flex-col rounded-xl overflow-hidden" style={{ background: '#f4f4f5' }}>
      {/* Drag handle */}
      <div
        className="w-full flex items-center justify-center cursor-ns-resize group py-2"
        onMouseDown={handleDragStart}
      >
        <div className="w-8 h-0.5 rounded-full bg-[#d4d4d8] group-hover:bg-[#a1a1aa] transition-colors" />
      </div>

      <div className="relative" style={{ height }}>
        <div className="absolute top-2 left-4 flex items-center gap-2 pointer-events-none">
          <span className="text-[10px] text-[#a1a1aa] select-none tracking-wide uppercase">Notes</span>
          {isDirty && <span className="text-[9px] text-[#c4c4c7]">saving…</span>}
        </div>

        <textarea
          value={localContent}
          onChange={e => handleChange(e.target.value)}
          className="w-full h-full resize-none bg-transparent text-sm text-[#18181b] leading-relaxed outline-none"
          style={{ padding: '28px 16px 12px', caretColor: '#18181b' }}
          placeholder="Notes, ideas, design thoughts…"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
