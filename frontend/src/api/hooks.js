import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './client';

function normalizeCacheId(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const stringValue = String(value).trim();
  return stringValue ? stringValue : null;
}

function invalidateProfileAnalytics(queryClient, profileId) {
  const normalizedProfileId = normalizeCacheId(profileId);
  if (!normalizedProfileId) {
    return;
  }
  const cachePrefixes = [
    'profile-summary',
    'stats-overview',
    'stats-volume',
    'stats-sets-muscle',
    'stats-intensity',
    'stats-e1rm',
  ];

  cachePrefixes.forEach((prefix) => {
    queryClient.invalidateQueries({
      predicate: (query) =>
        Array.isArray(query.queryKey) &&
        query.queryKey[0] === prefix &&
        query.queryKey.length > 1 &&
        String(query.queryKey[1]) === normalizedProfileId,
    });
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: () => apiRequest('/profiles'),
  });
}

export function useProfileSummary(profileId) {
  const normalizedProfileId = normalizeCacheId(profileId);
  return useQuery({
    queryKey: ['profile-summary', normalizedProfileId],
    queryFn: () => apiRequest(`/profiles/${profileId}/summary`),
    enabled: Boolean(normalizedProfileId),
  });
}

export function useWeekPlan(profileId, weekStart) {
  const normalizedProfileId = normalizeCacheId(profileId);
  return useQuery({
    queryKey: ['week-plan', normalizedProfileId, weekStart],
    queryFn: () =>
      apiRequest(`/profiles/${profileId}/week?start=${encodeURIComponent(weekStart)}`),
    enabled: Boolean(normalizedProfileId && weekStart),
  });
}

export function useSessions(profileId, range) {
  const normalizedProfileId = normalizeCacheId(profileId);
  const searchParams = new URLSearchParams(range);
  return useQuery({
    queryKey: ['sessions', normalizedProfileId, searchParams.toString()],
    queryFn: () => apiRequest(`/profiles/${profileId}/sessions?${searchParams}`),
    enabled: Boolean(normalizedProfileId),
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
  const normalizedProfileId = normalizeCacheId(profileId);
  return useQuery({
    queryKey: [
      'session-lookup',
      normalizedProfileId,
      workoutId,
      scheduledFor || null,
    ],
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
    enabled: Boolean(normalizedProfileId && workoutId),
  });
}

export function useStatsOverview(profileId, weeks) {
  const normalizedProfileId = normalizeCacheId(profileId);
  return useQuery({
    queryKey: ['stats-overview', normalizedProfileId, weeks],
    queryFn: () => apiRequest(`/stats/profiles/${profileId}/overview?window=weeks:${weeks}`),
    enabled: Boolean(normalizedProfileId),
  });
}

export function useVolumeTrend(profileId, weeks) {
  const normalizedProfileId = normalizeCacheId(profileId);
  return useQuery({
    queryKey: ['stats-volume', normalizedProfileId, weeks],
    queryFn: () => apiRequest(`/stats/profiles/${profileId}/volume?granularity=week&weeks=${weeks}`),
    enabled: Boolean(normalizedProfileId),
  });
}

export function useSetsPerMuscle(profileId, weeks) {
  const normalizedProfileId = normalizeCacheId(profileId);
  return useQuery({
    queryKey: ['stats-sets-muscle', normalizedProfileId, weeks],
    queryFn: () => apiRequest(`/stats/profiles/${profileId}/sets-per-muscle?weeks=${weeks}`),
    enabled: Boolean(normalizedProfileId),
  });
}

export function useIntensityDistribution(profileId, weeks) {
  const normalizedProfileId = normalizeCacheId(profileId);
  return useQuery({
    queryKey: ['stats-intensity', normalizedProfileId, weeks],
    queryFn: () => apiRequest(`/stats/profiles/${profileId}/intensity?weeks=${weeks}`),
    enabled: Boolean(normalizedProfileId),
  });
}

export function useExerciseE1RM(profileId, exerciseId, weeks) {
  const normalizedProfileId = normalizeCacheId(profileId);
  return useQuery({
    queryKey: ['stats-e1rm', normalizedProfileId, exerciseId, weeks],
    queryFn: () => apiRequest(`/stats/profiles/${profileId}/e1rm?exercise_id=${exerciseId}&weeks=${weeks}`),
    enabled: Boolean(normalizedProfileId && exerciseId),
  });
}

export function useStartSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiRequest('/sessions', { method: 'POST', body: payload }),
    onSuccess: (_data, variables) => {
      const profileKey = normalizeCacheId(variables?.profile_id);
      if (profileKey) {
        console.log('[useStartSession] created session, invalidating sessions query', {
          profileId: profileKey,
        });
        queryClient.invalidateQueries({
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === 'sessions' &&
            query.queryKey.length > 1 &&
            String(query.queryKey[1]) === profileKey,
        });
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
      const normalizedProfileKey = normalizeCacheId(profileKey);
      if (normalizedProfileKey) {
        console.log('[useSaveSessionSets] invalidating stats for profile', {
          profileId: normalizedProfileKey,
        });
        invalidateProfileAnalytics(queryClient, normalizedProfileKey);
      }
    },
    onError: (error, variables) => {
      const id = variables?.sessionId ?? sessionId;
      const profileKey = variables?.profileId ?? profileId;
      const normalizedProfileKey = normalizeCacheId(profileKey);
      console.error('[useSaveSessionSets] failed to save session sets', {
        sessionId: id,
        profileId: normalizedProfileKey,
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
      const profileKey = normalizeCacheId(variables?.profileId);
      if (profileKey) {
        console.log('[useFinishSession] finished session, invalidating stats', {
          sessionId: variables?.sessionId,
          profileId: profileKey,
        });
        invalidateProfileAnalytics(queryClient, profileKey);
      }
    },
  });
}
