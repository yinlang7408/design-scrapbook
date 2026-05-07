import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface SelectionState {
  isSelectionMode: boolean;
  selectedIds: Set<string>;
  selectedCount: number;
  isGenerating: boolean;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  toggleImage: (id: string) => void;
  isSelected: (id: string) => boolean;
  setGenerating: (v: boolean) => void;
}

const SelectionContext = createContext<SelectionState | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [isSelectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isGenerating, setGenerating] = useState(false);

  const enterSelectionMode = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(true);
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const toggleImage = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  return (
    <SelectionContext.Provider
      value={{
        isSelectionMode,
        selectedIds,
        selectedCount: selectedIds.size,
        isGenerating,
        enterSelectionMode,
        exitSelectionMode,
        toggleImage,
        isSelected,
        setGenerating,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelectionContext() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error('useSelectionContext must be used within SelectionProvider');
  return ctx;
}
