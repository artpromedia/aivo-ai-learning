import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { API } from '@/constants/api';

interface TeamMember {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'active' | 'pending';
}

interface Seats {
  used: number;
  max: number;
}

interface CollaborationData {
  members: TeamMember[];
  seats: {
    teacher: Seats;
    caregiver: Seats;
    therapist: Seats;
  };
}

export function useCollaboration(learnerId: string) {
  return useQuery<CollaborationData>({
    queryKey: ['collaboration', learnerId],
    queryFn: async () => {
      const res = await apiFetch(API.FAMILY, `/api/family/collaboration/${learnerId}/members`);
      if (!res.ok) throw new Error('Failed to fetch team');
      return res.json();
    },
    enabled: !!learnerId,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      learnerId,
      email,
      role,
    }: {
      learnerId: string;
      email: string;
      role: string;
    }) => {
      const res = await apiFetch(API.FAMILY, `/api/family/collaboration/${learnerId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) throw new Error('Failed to invite');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', variables.learnerId] });
    },
  });
}

export function useConnectedLearners() {
  return useQuery({
    queryKey: ['connected-learners'],
    queryFn: async () => {
      const res = await apiFetch(API.FAMILY, '/api/family/collaboration/connected-learners');
      if (!res.ok) throw new Error('Failed to fetch connected learners');
      return res.json();
    },
  });
}

export function useIEPGoals(learnerId: string) {
  return useQuery({
    queryKey: ['iep-goals', learnerId],
    queryFn: async () => {
      const res = await apiFetch(API.FAMILY, `/api/family/iep-goals/${learnerId}`);
      if (!res.ok) throw new Error('Failed to fetch IEP goals');
      return res.json();
    },
    enabled: !!learnerId,
  });
}

export function useTherapyGoals(learnerId: string) {
  return useQuery({
    queryKey: ['therapy-goals', learnerId],
    queryFn: async () => {
      const res = await apiFetch(API.FAMILY, `/api/family/therapy-goals/${learnerId}`);
      if (!res.ok) throw new Error('Failed to fetch therapy goals');
      return res.json();
    },
    enabled: !!learnerId,
  });
}
