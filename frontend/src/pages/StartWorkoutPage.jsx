import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  useWorkout,
  useStartSession,
  useSaveSessionSets,
  useFinishSession,
  useSessionLookup,
} from '../api/hooks';
import { useToast } from '../components/ToastProvider';
import styles from '../styles/StartWorkout.module.css';
import dayjs from '../utils/date';
import { formatDate } from '../utils/format';

function groupSetsByExercise(savedSets = []) {
  return savedSets.reduce((map, set) => {
    const current = map.get(set.exercise_id) || [];
    current.push(set);
    map.set(set.exercise_id, current);
    return map;
  }, new Map());
}

function resolveStatus(savedEntries = []) {
  if (!savedEntries.length) {
    return 'idle';
  }
  const hasTrackedValue = savedEntries.some(
    (entry) => entry.actual_reps !== null || entry.actual_weight !== null
  );
  return hasTrackedValue ? 'saved' : 'skipped';
}

function buildInitialState(workout, savedSets = []) {
  const state = {};
  const setsByExercise = groupSetsByExercise(savedSets);
  workout?.exercises?.forEach((exercise) => {
    const savedEntries = (setsByExercise.get(exercise.exercise_id) || [])
      .slice()
      .sort((a, b) => a.set_number - b.set_number);
    const inputs = exercise.prescriptions.map((_, idx) => {
      const saved = savedEntries.find((entry) => entry.set_number === idx + 1);
      return {
        reps:
          saved && saved.actual_reps !== null && saved.actual_reps !== undefined
            ? String(saved.actual_reps)
            : '',
        weight:
          saved && saved.actual_weight !== null && saved.actual_weight !== undefined
            ? String(saved.actual_weight)
            : '',
      };
    });
    state[exercise.workout_exercise_id] = {
      inputs,
      status: resolveStatus(savedEntries),
    };
  });
  return state;
}

function StartWorkoutPage() {
  const { workoutId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const search = new URLSearchParams(location.search);
  const profileId = search.get('profileId');
  const scheduledDate = search.get('date');
  const { notify } = useToast();

  const { data: workout } = useWorkout(workoutId);
  const sessionLookup = useSessionLookup(profileId, workoutId, scheduledDate);
  const existingSession = sessionLookup.data;
  const [sessionId, setSessionId] = useState(null);
  const [exerciseState, setExerciseState] = useState({});
  const initializedSessionRef = useRef(null);

  const startSession = useStartSession();
  const finishSession = useFinishSession();
  const saveSessionSets = useSaveSessionSets(sessionId);

  useEffect(() => {
    if (!workout || sessionLookup.isLoading) return;
    const sessionKey = `${workout.id || 'workout'}:${scheduledDate || 'unscheduled'}:${existingSession?.id || 'new'}`;
    if (initializedSessionRef.current === sessionKey) {
      return;
    }
    setExerciseState(buildInitialState(workout, existingSession?.sets || []));
    initializedSessionRef.current = sessionKey;
  }, [workout, existingSession, sessionLookup.isLoading, scheduledDate]);

  useEffect(() => {
    if (existingSession?.id) {
      setSessionId(existingSession.id);
    }
  }, [existingSession]);

  useEffect(() => {
    if (
      !workoutId ||
      !profileId ||
      sessionId ||
      startSession.isPending ||
      sessionLookup.isLoading ||
      sessionLookup.isFetching ||
      existingSession?.id
    )
      return;
    const startedAt = scheduledDate
      ? dayjs(`${scheduledDate}T${dayjs().format('HH:mm:ss')}`).toISOString()
      : dayjs().toISOString();
    startSession.mutate(
      {
        profile_id: Number(profileId),
        workout_id: Number(workoutId),
        started_at: startedAt,
      },
      {
        onSuccess: (data) => {
          setSessionId(data.id);
        },
        onError: (error) => {
          notify({ message: error.message, variant: 'error' });
        },
      }
    );
  }, [
    profileId,
    workoutId,
    scheduledDate,
    sessionId,
    startSession,
    notify,
    sessionLookup.isLoading,
    sessionLookup.isFetching,
    existingSession,
  ]);

  const headerDate = scheduledDate ? formatDate(scheduledDate) : formatDate(new Date());

  const isExerciseComplete = (exerciseId) => exerciseState[exerciseId]?.status !== 'idle';

  const updateInput = (exerciseId, setIndex, field, value) => {
    setExerciseState((prev) => {
      const exercise = prev[exerciseId];
      if (!exercise) return prev;
      const inputs = exercise.inputs.map((entry, idx) =>
        idx === setIndex ? { ...entry, [field]: value } : entry
      );
      return {
        ...prev,
        [exerciseId]: {
          ...exercise,
          inputs,
          status: exercise.status === 'saved' ? 'edited' : exercise.status,
        },
      };
    });
  };

  const handleSave = async (exercise) => {
    if (!sessionId) {
      notify({ message: 'Preparing session, please wait…', variant: 'info' });
      return;
    }
    const entry = exerciseState[exercise.workout_exercise_id];
    if (!entry) return;

    let payloadSets;
    try {
      payloadSets = entry.inputs.map((input, idx) => {
        const reps = input.reps === '' ? null : Number(input.reps);
        const weight = input.weight === '' ? null : Number(input.weight);
        if (reps !== null && Number.isNaN(reps)) {
          throw new Error('Reps must be a number');
        }
        if (weight !== null && Number.isNaN(weight)) {
          throw new Error('Weight must be a number');
        }
        return {
          exercise_id: exercise.exercise_id,
          set_number: idx + 1,
          actual_reps: reps,
          actual_weight: weight,
        };
      });
    } catch (error) {
      notify({ message: error.message, variant: 'error' });
      return;
    }

    try {
      await saveSessionSets.mutateAsync({ sets: payloadSets });
      setExerciseState((prev) => ({
        ...prev,
        [exercise.workout_exercise_id]: {
          ...prev[exercise.workout_exercise_id],
          status: 'saved',
        },
      }));
      notify({ message: `${exercise.name} saved`, variant: 'success' });
    } catch (error) {
      notify({ message: error.message, variant: 'error' });
    }
  };

  const handleSkip = async (exercise) => {
    if (!sessionId) return;
    const payloadSets = exercise.prescriptions.map((_, idx) => ({
      exercise_id: exercise.exercise_id,
      set_number: idx + 1,
      actual_reps: null,
      actual_weight: null,
    }));
    try {
      await saveSessionSets.mutateAsync({ sets: payloadSets });
      setExerciseState((prev) => ({
        ...prev,
        [exercise.workout_exercise_id]: {
          ...prev[exercise.workout_exercise_id],
          status: 'skipped',
        },
      }));
      notify({ message: `${exercise.name} marked as skipped`, variant: 'info' });
    } catch (error) {
      notify({ message: error.message, variant: 'error' });
    }
  };

  const pendingExercises = useMemo(
    () =>
      Object.values(exerciseState).filter(
        (exercise) => exercise.status === 'idle' || exercise.status === 'edited'
      ).length,
    [exerciseState]
  );

  const handleFinish = () => {
    if (!sessionId) {
      notify({ message: 'Session not ready yet', variant: 'info' });
      return;
    }
    if (pendingExercises > 0) {
      notify({ message: 'Please save or skip all exercises before finishing.', variant: 'info' });
      return;
    }
    finishSession.mutate(
      { sessionId, body: { ended_at: dayjs().toISOString() }, profileId: Number(profileId) },
      {
        onSuccess: () => {
          notify({ message: 'Workout saved', variant: 'success' });
          navigate(`/profile/${profileId}`);
        },
        onError: (error) => {
          notify({ message: error.message, variant: 'error' });
        },
      }
    );
  };

  return (
    <div className="container">
      <header className={styles.header}>
        <div>
          <h1>{workout?.name || 'Workout'}</h1>
          <p>Scheduled for {headerDate}</p>
        </div>
        <button type="button" className={styles.finishButton} onClick={handleFinish}>
          Finish workout
        </button>
      </header>

      <div className={styles.exerciseList}>
        {workout?.exercises?.map((exercise) => (
          <article key={exercise.workout_exercise_id} className={styles.exerciseCard}>
            <header>
              <div>
                <h2>{exercise.name}</h2>
                <span>{exercise.muscle_group}</span>
              </div>
              <span className={`${styles.status} ${styles[exerciseState[exercise.workout_exercise_id]?.status || 'idle']}`}>
                {exerciseState[exercise.workout_exercise_id]?.status || 'idle'}
              </span>
            </header>
            <table>
              <thead>
                <tr>
                  <th>Set</th>
                  <th>Target</th>
                  <th>Reps</th>
                  <th>Weight</th>
                </tr>
              </thead>
              <tbody>
                {exercise.prescriptions.map((set, index) => (
                  <tr key={set.id}>
                    <td>{set.set_number}</td>
                    <td>
                      {set.target_reps} reps @ {set.target_weight} lbs
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={exerciseState[exercise.workout_exercise_id]?.inputs[index]?.reps ?? ''}
                        onChange={(event) =>
                          updateInput(exercise.workout_exercise_id, index, 'reps', event.target.value)
                        }
                        disabled={isExerciseComplete(exercise.workout_exercise_id)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        inputMode="decimal"
                        value={exerciseState[exercise.workout_exercise_id]?.inputs[index]?.weight ?? ''}
                        onChange={(event) =>
                          updateInput(exercise.workout_exercise_id, index, 'weight', event.target.value)
                        }
                        disabled={isExerciseComplete(exercise.workout_exercise_id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.cardActions}>
              <button
                type="button"
                onClick={() => handleSave(exercise)}
                disabled={isExerciseComplete(exercise.workout_exercise_id)}
              >
                Save &amp; next exercise
              </button>
              <button
                type="button"
                onClick={() => handleSkip(exercise)}
                disabled={isExerciseComplete(exercise.workout_exercise_id)}
                className={styles.skip}
              >
                Skip exercise
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default StartWorkoutPage;
