import { Link } from 'react-router-dom';
import styles from '../styles/WeekPlanGrid.module.css';
import { formatDay } from '../utils/format';

function WorkoutCard({ workout, profileId }) {
  if (!workout) {
    return (
      <div className={`${styles.workoutCard} ${styles.rest}`}>Rest day</div>
    );
  }

  return (
    <Link
      to={`/workout/${workout.id}/start?profileId=${profileId}&date=${workout.scheduled_for}`}
      className={styles.workoutCard}
    >
      <header>
        <span className={styles.workoutName}>{workout.name}</span>
      </header>
      <ul>
        {workout.exercises.map((exercise) => (
          <li key={exercise.workout_exercise_id}>
            <div>
              <span className={styles.exerciseName}>{exercise.name}</span>
              <span className={styles.muscleGroup}>{exercise.muscle_group}</span>
            </div>
            <div className={styles.prescription}>
              {exercise.prescriptions.map((set) => (
                <span key={set.id}>
                  {set.target_reps} reps @ {set.target_weight} lbs
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </Link>
  );
}

function WeekPlanGrid({ plan, profileId }) {
  if (!plan) return null;

  return (
    <div className={styles.grid}>
      {plan.days.map((day) => (
        <div key={day.date} className={styles.dayColumn}>
          <div className={styles.dayHeader}>{formatDay(day.date)}</div>
          {day.workouts.length ? (
            day.workouts.map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} profileId={profileId} />
            ))
          ) : (
            <WorkoutCard workout={null} profileId={profileId} />
          )}
        </div>
      ))}
    </div>
  );
}

export default WeekPlanGrid;
