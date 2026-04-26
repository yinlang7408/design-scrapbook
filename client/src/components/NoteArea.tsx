import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchNote, saveNote } from '@/lib/api';
import { dateToStr } from '@/lib/utils';

const MIN_HEIGHT = 80;
const MAX_HEIGHT = 480;

interface NoteAreaProps {
  date: Date;
}

export function NoteArea({ date }: NoteAreaProps) {
  const dateStr = dateToStr(date);
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

  // Drag resize
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartY.current = e.clientY;
    dragStartH.current = height;

    const onMove = (ev: MouseEvent) => {
      if (dragStartY.current === null) return;
      const delta = dragStartY.current - ev.clientY;
      const newH = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, dragStartH.current + delta));
      setHeight(newH);
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
    <div className="w-full flex flex-col" style={{ paddingTop: 2 }}>
      {/* Drag handle */}
      <div
        className="w-full flex items-center justify-center cursor-ns-resize group py-1.5"
        onMouseDown={handleDragStart}
      >
        <div className="w-12 h-1 rounded-full bg-ink/10 group-hover:bg-ink/25 transition-colors" />
      </div>

      {/* Note section */}
      <div
        className="w-full border-t border-dashed border-ink/10 relative"
        style={{ height }}
      >
        {/* Label */}
        <div className="absolute top-2 left-3 flex items-center gap-2 pointer-events-none">
          <span className="font-caveat text-sm text-ink-light opacity-50 select-none">✏ 笔记</span>
          {isDirty && (
            <span className="font-kalam text-[9px] text-ink-light opacity-40">保存中...</span>
          )}
        </div>

        <textarea
          value={localContent}
          onChange={e => handleChange(e.target.value)}
          className="w-full h-full resize-none bg-transparent font-caveat text-sm text-ink leading-relaxed outline-none"
          style={{
            padding: '28px 16px 12px',
            caretColor: '#2d2416',
          }}
          placeholder="在这里记录灵感、想法、设计思路..."
          spellCheck={false}
        />

        {/* Subtle ruled lines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(45,36,22,0.04) 27px, rgba(45,36,22,0.04) 28px)',
            backgroundPosition: '0 32px',
          }}
        />
      </div>
    </div>
  );
}
