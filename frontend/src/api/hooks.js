import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './client';

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: () => apiRequest('/profiles'),
  });
}

export function useProfileSummary(profileId) {
  return useQuery({
    queryKey: ['profile-summary', profileId],
    queryFn: () => apiRequest(`/profiles/${profileId}/summary`),
    enabled: Boolean(profileId),
  });
}

export function useWeekPlan(profileId, weekStart) {
  return useQuery({
    queryKey: ['week-plan', profileId, weekStart],
    queryFn: () =>
      apiRequest(`/profiles/${profileId}/week?start=${encodeURIComponent(weekStart)}`),
    enabled: Boolean(profileId && weekStart),
  });
}

export function useSessions(profileId, range) {
  const searchParams = new URLSearchParams(range);
  return useQuery({
    queryKey: ['sessions', profileId, searchParams.toString()],
    queryFn: () => apiRequest(`/profiles/${profileId}/sessions?${searchParams}`),
    enabled: Boolean(profileId),
  });
}

export function useWorkout(workoutId) {
  return useQuery({
    queryKey: ['workout', workoutId],
    queryFn: () => apiRequest(`/workouts/${workoutId}`),
    enabled: Boolean(workoutId),
  });
}

export function useSessionLookup(profileId, workoutId, scheduledFor) {
  return useQuery({
    queryKey: ['session-lookup', profileId, workoutId, scheduledFor || null],
    queryFn: () => {
      const params = new URLSearchParams({
        profile_id: profileId,
        workout_id: workoutId,
      });
      if (scheduledFor) {
        params.set('scheduled_for', scheduledFor);
      }
      return apiRequest(`/sessions/lookup?${params.toString()}`);
    },
    enabled: Boolean(profileId && workoutId),
  });
}

export function useStatsOverview(profileId, weeks) {
  return useQuery({
    queryKey: ['stats-overview', profileId, weeks],
    queryFn: () => apiRequest(`/stats/profiles/${profileId}/overview?window=weeks:${weeks}`),
    enabled: Boolean(profileId),
  });
}

export function useVolumeTrend(profileId, weeks) {
  return useQuery({
    queryKey: ['stats-volume', profileId, weeks],
    queryFn: () => apiRequest(`/stats/profiles/${profileId}/volume?granularity=week&weeks=${weeks}`),
    enabled: Boolean(profileId),
  });
}

export function useSetsPerMuscle(profileId, weeks) {
  return useQuery({
    queryKey: ['stats-sets-muscle', profileId, weeks],
    queryFn: () => apiRequest(`/stats/profiles/${profileId}/sets-per-muscle?weeks=${weeks}`),
    enabled: Boolean(profileId),
  });
}

export function useIntensityDistribution(profileId, weeks) {
  return useQuery({
    queryKey: ['stats-intensity', profileId, weeks],
    queryFn: () => apiRequest(`/stats/profiles/${profileId}/intensity?weeks=${weeks}`),
    enabled: Boolean(profileId),
  });
}

export function useExerciseE1RM(profileId, exerciseId, weeks) {
  return useQuery({
    queryKey: ['stats-e1rm', profileId, exerciseId, weeks],
    queryFn: () => apiRequest(`/stats/profiles/${profileId}/e1rm?exercise_id=${exerciseId}&weeks=${weeks}`),
    enabled: Boolean(profileId && exerciseId),
  });
}

export function useStartSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiRequest('/sessions', { method: 'POST', body: payload }),
    onSuccess: (_data, variables) => {
      const profileKey = variables?.profile_id != null ? String(variables.profile_id) : null;
      if (profileKey) {
        console.log('[useStartSession] created session, invalidating sessions query', {
          profileId: profileKey,
        });
        queryClient.invalidateQueries({ queryKey: ['sessions', profileKey] });
      }
    },
  });
}

export function useSaveSessionSets(sessionId, profileId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => {
      const id = payload.sessionId ?? sessionId;
      if (!id) {
        throw new Error('Session not ready');
      }
      const body = { ...payload };
      delete body.sessionId;
      delete body.profileId;
      return apiRequest(`/sessions/${id}/sets/bulk`, { method: 'POST', body });
    },
    onSuccess: (_data, variables) => {
      const id = variables.sessionId ?? sessionId;
      if (id) {
        console.log('[useSaveSessionSets] saved sets for session, invalidating cache', {
          sessionId: id,
        });
        queryClient.invalidateQueries({ queryKey: ['session-sets', id] });
      }
      const profileKey = variables.profileId ?? profileId;
      const normalizedProfileKey = profileKey != null ? String(profileKey) : null;
      if (normalizedProfileKey) {
        console.log('[useSaveSessionSets] invalidating stats for profile', {
          profileId: normalizedProfileKey,
        });
        queryClient.invalidateQueries({ queryKey: ['profile-summary', normalizedProfileKey] });
        queryClient.invalidateQueries({ queryKey: ['stats-overview', normalizedProfileKey] });
        queryClient.invalidateQueries({ queryKey: ['stats-volume', normalizedProfileKey] });
        queryClient.invalidateQueries({ queryKey: ['stats-sets-muscle', normalizedProfileKey] });
        queryClient.invalidateQueries({ queryKey: ['stats-intensity', normalizedProfileKey] });
        queryClient.invalidateQueries({ queryKey: ['stats-e1rm', normalizedProfileKey] });
      }
    },
    onError: (error, variables) => {
      const id = variables?.sessionId ?? sessionId;
      const profileKey = variables?.profileId ?? profileId;
      console.error('[useSaveSessionSets] failed to save session sets', {
        sessionId: id,
        profileId: profileKey != null ? String(profileKey) : null,
        message: error?.message,
      });
    },
  });
}

export function useFinishSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, body }) =>
      apiRequest(`/sessions/${sessionId}/finish`, { method: 'POST', body }),
    onSuccess: (data, variables) => {
      const profileKey = variables?.profileId != null ? String(variables.profileId) : null;
      if (profileKey) {
        console.log('[useFinishSession] finished session, invalidating stats', {
          sessionId: variables?.sessionId,
          profileId: profileKey,
        });
        queryClient.invalidateQueries({ queryKey: ['profile-summary', profileKey] });
        queryClient.invalidateQueries({ queryKey: ['stats-overview', profileKey] });
        queryClient.invalidateQueries({ queryKey: ['stats-volume', profileKey] });
        queryClient.invalidateQueries({ queryKey: ['stats-sets-muscle', profileKey] });
        queryClient.invalidateQueries({ queryKey: ['stats-intensity', profileKey] });
        queryClient.invalidateQueries({ queryKey: ['stats-e1rm', profileKey] });
      }
    },
  });
}
