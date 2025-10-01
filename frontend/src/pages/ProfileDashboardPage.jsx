import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useProfiles,
  useWeekPlan,
  useStatsOverview,
  useProfileSummary,
} from '../api/hooks';
import WeekPlanGrid from '../components/WeekPlanGrid';
import StatsView from '../components/StatsView';
import { useToast } from '../components/ToastProvider';
import styles from '../styles/ProfileDashboard.module.css';
import dayjs, { startOfIsoWeek, formatIso } from '../utils/date';
import { formatDate, formatNumber } from '../utils/format';

const TABS = [
  { id: 'plan', label: 'Week Plan' },
  { id: 'stats', label: 'Stats' },
];

function ProfileDashboardPage() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [currentTab, setCurrentTab] = useState('plan');
  const [weekStart, setWeekStart] = useState(() => formatIso(startOfIsoWeek()));

  const { data: profiles } = useProfiles();
  const profile = profiles?.find((item) => String(item.id) === String(profileId));

  const { data: weekPlan, isLoading: weekLoading } = useWeekPlan(profileId, weekStart);
  const { data: overview } = useStatsOverview(profileId, 4);
  const { data: summary } = useProfileSummary(profileId);

  const nextWorkout = useMemo(() => {
    if (!weekPlan?.days) return null;
    const todayIso = formatIso(dayjs());
    for (const day of weekPlan.days) {
      for (const workout of day.workouts) {
        if (workout.scheduled_for >= todayIso) {
          return workout;
        }
      }
    }
    // fallback to first workout of week
    for (const day of weekPlan.days) {
      if (day.workouts.length) {
        return day.workouts[0];
      }
    }
    return null;
  }, [weekPlan]);

  const handleWeekOffset = (offset) => {
    const newDate = dayjs(weekStart).add(offset, 'week');
    setWeekStart(formatIso(startOfIsoWeek(newDate)));
  };

  const handleStartWorkout = () => {
    if (!nextWorkout) {
      notify({ message: 'No workout scheduled for this week yet.', variant: 'info' });
      return;
    }
    navigate(`/workout/${nextWorkout.id}/start?profileId=${profileId}&date=${nextWorkout.scheduled_for}`);
  };

  return (
    <div className="container">
      <header className={styles.header}>
        <div>
          <h1>{profile?.name || 'Profile'}</h1>
          <p>Weekly hypertrophy split with progressive overload and compliance analytics.</p>
        </div>
        <div className={styles.kpiBubble}>
          <span>Last session</span>
          <strong>{formatDate(summary?.last_session_at)}</strong>
        </div>
      </header>

      <div className={styles.summaryStrip}>
        <div>
          <span className={styles.summaryLabel}>Rolling tonnage (4 weeks)</span>
          <strong>{overview ? `${formatNumber(overview.tonnage)} lbs` : '—'}</strong>
        </div>
        <div>
          <span className={styles.summaryLabel}>Adherence</span>
          <strong>
            {overview?.adherence_percentage != null ? `${overview.adherence_percentage}%` : '—'}
          </strong>
        </div>
        <div>
          <span className={styles.summaryLabel}>Top lift</span>
          <strong>
            {overview?.best_e1rm
              ? `${overview.best_e1rm.exercise_name} · ${formatNumber(overview.best_e1rm.value, { maximumFractionDigits: 1 })} lbs`
              : '—'}
          </strong>
        </div>
        <div className={styles.weekControls}>
          <button type="button" onClick={() => handleWeekOffset(-1)}>
            ◀ Prev week
          </button>
          <span>{weekPlan ? `${formatDate(weekPlan.start)} - ${formatDate(weekPlan.end)}` : '—'}</span>
          <button type="button" onClick={() => handleWeekOffset(1)}>
            Next week ▶
          </button>
        </div>
      </div>

      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={currentTab === tab.id ? styles.active : ''}
            onClick={() => setCurrentTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className={styles.contentSection}>
        {currentTab === 'plan' && (
          weekLoading ? <div className={styles.loading}>Loading plan…</div> : <WeekPlanGrid plan={weekPlan} profileId={profileId} />
        )}
        {currentTab === 'stats' && <StatsView profileId={profileId} />}
      </section>

      <button type="button" className={styles.startButton} onClick={handleStartWorkout}>
        Start workout
      </button>
    </div>
  );
}

export default ProfileDashboardPage;
