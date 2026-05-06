import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { API } from '@/constants/api';

export interface HomeworkAssignment {
  id: string;
  subject: string;
  status: 'PROCESSING' | 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | string;
  homeworkMode: string;
  detectedSubject: string;
  problemCount: number;
  adaptedCount: number;
  createdAt: string;
}

export function useHomeworkAssignments(learnerId: string) {
  return useQuery<HomeworkAssignment[]>({
    queryKey: ['homework-assignments', learnerId],
    queryFn: async () => {
      const res = await apiFetch(API.TUTOR, `/api/tutors/homework/learner/${learnerId}`);
      if (!res.ok) throw new Error('Failed to load homework');
      const data = await res.json();
      return (data.assignments ?? []) as HomeworkAssignment[];
    },
    enabled: !!learnerId,
    staleTime: 30 * 1000,
  });
}
