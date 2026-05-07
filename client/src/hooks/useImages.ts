import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchImages, fetchAllImages, uploadImage, deleteImage, deleteTerm, retryTerms } from '@/lib/api';
import type { ImageRecord, Term } from '@/lib/api';
import { dateToStr } from '@/lib/utils';

export function useImages(start: Date, end: Date) {
  const startStr = dateToStr(start);
  const endStr = dateToStr(end);

  return useQuery({
    queryKey: ['images', startStr, endStr],
    queryFn: () => fetchImages(startStr, endStr),
    placeholderData: [],
  });
}

export function useUploadImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, date }: { file: File; date: string }) => uploadImage(file, date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['images'] });
      qc.invalidateQueries({ queryKey: ['quota'] });
    },
  });
}

export function useDeleteImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteImage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['images'] });
      qc.invalidateQueries({ queryKey: ['quota'] });
    },
  });
}

export function useDeleteTerm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ imageId, termId }: { imageId: string; termId: string }) => deleteTerm(imageId, termId),
    onMutate: async ({ imageId, termId }) => {
      await qc.cancelQueries({ queryKey: ['images'] });
      const previous = qc.getQueriesData<ImageRecord[]>({ queryKey: ['images'] });
      qc.setQueriesData<ImageRecord[]>({ queryKey: ['images'] }, (old) =>
        old?.map(img =>
          img.id === imageId
            ? { ...img, terms: img.terms.filter(t => t.id !== termId) }
            : img
        )
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        ctx.previous.forEach(([key, data]) => qc.setQueryData(key, data));
      }
    },
  });
}

export function useRetryTerms() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) => retryTerms(imageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['images'] }),
  });
}
