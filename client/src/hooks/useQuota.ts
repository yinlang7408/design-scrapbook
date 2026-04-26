import { useQuery } from '@tanstack/react-query';
import { fetchQuota } from '@/lib/api';

export function useQuota() {
  return useQuery({
    queryKey: ['quota'],
    queryFn: fetchQuota,
    refetchInterval: 60_000,
  });
}
