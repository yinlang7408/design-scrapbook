import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });

// Attach fingerprint to every request
api.interceptors.request.use(config => {
  const uid = localStorage.getItem('design-journal-uid');
  if (uid) config.headers['X-User-ID'] = uid;
  return config;
});

export interface Term {
  id: string;
  imageId: string;
  termEn: string;
  termZh: string;
  position: number;
}

export interface ImageRecord {
  id: string;
  userId: string;
  date: string;
  filePath: string;
  mimeType: string;
  createdAt: string;
  terms: Term[];
}

export interface QuotaResponse {
  timezone: string;
  daily: { costCents: number; callCount: number; limitCents: number; remaining: number };
  user: { count: number; limit: number; allowed: boolean };
}

export async function uploadImage(file: File, date: string): Promise<{ image: ImageRecord; terms: Term[]; termsError?: string }> {
  const form = new FormData();
  form.append('image', file);
  form.append('date', date);
  const res = await api.post('/images/upload', form);
  return res.data;
}

export async function fetchImages(start: string, end: string): Promise<ImageRecord[]> {
  const res = await api.get('/images', { params: { start, end } });
  return res.data;
}

export async function deleteImage(id: string): Promise<void> {
  await api.delete(`/images/${id}`);
}

export async function deleteTerm(imageId: string, termId: string): Promise<void> {
  await api.delete(`/images/${imageId}/terms/${termId}`);
}

export async function retryTerms(imageId: string): Promise<{ terms: Term[] }> {
  const res = await api.post(`/images/${imageId}/retry-terms`);
  return res.data;
}

export async function fetchQuota(): Promise<QuotaResponse> {
  const res = await api.get('/quota');
  return res.data;
}

export async function fetchNote(date: string): Promise<{ content: string }> {
  const uid = localStorage.getItem('design-journal-uid') ?? '';
  const res = await api.get('/notes', { params: { date, uid } });
  return res.data;
}

export async function saveNote(date: string, content: string): Promise<void> {
  await api.put('/notes', { date, content });
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === 'string' && data.trim()) {
      return data;
    }

    if (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string' &&
      data.message.trim()
    ) {
      return data.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
