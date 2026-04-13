import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { API } from '@/constants/api';

interface BrainDomain {
  domain: string;
  enrolledGrade: string;
  functioningGrade: string;
  functioningLevel: string;
  masteryPercent: number;
  accommodations: string[];
}

interface BrainProfile {
  learnerId: string;
  learnerName: string;
  overallLevel: string;
  domains: BrainDomain[];
  sensoryProfile: Record<string, unknown>;
  iepGoals: IEPGoal[];
  recommendations: Recommendation[];
  lastUpdated: string;
}

interface IEPGoal {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: 'active' | 'met' | 'discontinued';
}

interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
}

export function useBrain(learnerId: string) {
  return useQuery<BrainProfile>({
    queryKey: ['brain', learnerId],
    queryFn: async () => {
      const res = await apiFetch(API.BRAIN, `/api/brain/${learnerId}`);
      if (!res.ok) throw new Error('Failed to fetch brain profile');
      return res.json();
    },
    enabled: !!learnerId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBrainRecommendations(learnerId: string) {
  return useQuery<Recommendation[]>({
    queryKey: ['brain', learnerId, 'recommendations'],
    queryFn: async () => {
      const res = await apiFetch(API.BRAIN, `/api/brain/${learnerId}/recommendations`);
      if (!res.ok) throw new Error('Failed to fetch recommendations');
      return res.json();
    },
    enabled: !!learnerId,
  });
}

export function useRecommendationAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      learnerId,
      recommendationId,
      action,
      context,
    }: {
      learnerId: string;
      recommendationId: string;
      action: 'approve' | 'decline' | 'add_context';
      context?: string;
    }) => {
      const res = await apiFetch(
        API.BRAIN,
        `/api/brain/${learnerId}/recommendations/${recommendationId}/${action}`,
        {
          method: 'POST',
          body: JSON.stringify({ context }),
        }
      );
      if (!res.ok) throw new Error('Action failed');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['brain', variables.learnerId] });
    },
  });
}
