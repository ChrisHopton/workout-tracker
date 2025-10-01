import { useState, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import {
  useStatsOverview,
  useVolumeTrend,
  useSetsPerMuscle,
  useIntensityDistribution,
} from '../api/hooks';
import { apiRequest } from '../api/client';
import { formatNumber } from '../utils/format';
import styles from '../styles/StatsView.module.css';
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

const WINDOW_OPTIONS = [4, 8, 12];

function StatsView({ profileId }) {
  const [windowWeeks, setWindowWeeks] = useState(8);
  const { data: overview, isLoading: overviewLoading } = useStatsOverview(profileId, windowWeeks);
  const { data: volumeTrend } = useVolumeTrend(profileId, windowWeeks);
  const { data: setsPerMuscle } = useSetsPerMuscle(profileId, windowWeeks);
  const { data: intensity } = useIntensityDistribution(profileId, windowWeeks);

  const topExercises = overview?.top_exercises || [];

  const e1rmQueries = useQueries({
    queries: topExercises.map((exercise) => ({
      queryKey: ['stats-e1rm', profileId, exercise.exercise_id, windowWeeks],
      queryFn: () =>
        apiRequest(
          `/stats/profiles/${profileId}/e1rm?exercise_id=${exercise.exercise_id}&weeks=${windowWeeks}`
        ),
      enabled: Boolean(profileId && exercise.exercise_id),
    })),
  });

  const e1rmSeries = useMemo(() => {
    return topExercises.map((exercise, index) => ({
      exercise,
      data: e1rmQueries[index]?.data || [],
      isLoading: e1rmQueries[index]?.isLoading,
    }));
  }, [topExercises, e1rmQueries]);

  const mergedE1RM = useMemo(() => {
    const map = new Map();
    e1rmSeries.forEach(({ exercise, data }) => {
      data.forEach((entry) => {
        const key = entry.performed_at;
        if (!map.has(key)) {
          map.set(key, { performed_at: key });
        }
        map.get(key)[exercise.exercise_name] = entry.e1rm;
      });
    });
    return Array.from(map.values()).sort((a, b) => (a.performed_at > b.performed_at ? 1 : -1));
  }, [e1rmSeries]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        <h2>Progress insights</h2>
        <div className={styles.windowToggle}>
          {WINDOW_OPTIONS.map((weeks) => (
            <button
              key={weeks}
              type="button"
              className={weeks === windowWeeks ? styles.active : ''}
              onClick={() => setWindowWeeks(weeks)}
            >
              {weeks}-week view
            </button>
          ))}
        </div>
      </div>

      <section className={styles.kpis}>
        <div className="shadow-card">
          <span className={styles.kpiLabel}>Rolling tonnage</span>
          <span className={styles.kpiValue}>
            {overviewLoading ? '—' : `${formatNumber(overview?.tonnage || 0)} lbs`}
          </span>
        </div>
        <div className="shadow-card">
          <span className={styles.kpiLabel}>Best e1RM</span>
          <span className={styles.kpiValue}>
            {overview?.best_e1rm
              ? `${overview.best_e1rm.exercise_name}: ${formatNumber(
                  overview.best_e1rm.value,
                  { maximumFractionDigits: 1 }
                )} lbs`
              : '—'}
          </span>
        </div>
        <div className="shadow-card">
          <span className={styles.kpiLabel}>Adherence</span>
          <span className={styles.kpiValue}>
            {overview?.adherence_percentage != null
              ? `${overview.adherence_percentage}%`
              : '—'}
          </span>
        </div>
      </section>

      <section className={styles.chartSection}>
        <header>
          <h3>Volume load per week</h3>
          <span className={styles.subtle}>Actual reps × weight, skipped sets excluded</span>
        </header>
        <div className={styles.chartCard}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={volumeTrend || []}>
              <defs>
                <linearGradient id="volume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 8" stroke="#e2e8f0" />
              <XAxis dataKey="week_start" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip formatter={(value) => `${formatNumber(value)} lbs`} />
              <Area type="monotone" dataKey="tonnage" stroke="#2563eb" fill="url(#volume)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className={styles.chartSection}>
        <header>
          <h3>Estimated 1RM trend</h3>
          <span className={styles.subtle}>Epley formula using tracked sets</span>
        </header>
        <div className={styles.chartCard}>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={mergedE1RM}>
              <CartesianGrid strokeDasharray="4 8" stroke="#e2e8f0" />
              <XAxis dataKey="performed_at" stroke="#94a3b8" allowDuplicatedCategory={false} />
              <YAxis stroke="#94a3b8" />
              <Tooltip formatter={(value) => `${formatNumber(value, { maximumFractionDigits: 1 })} lbs`} />
              <Legend />
              {e1rmSeries.map((series, index) => (
                <Line
                  key={series.exercise.exercise_id}
                  type="monotone"
                  dataKey={series.exercise.exercise_name}
                  stroke={[ '#1d4ed8', '#10b981', '#f97316' ][index % 3]}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className={styles.dualCharts}>
        <div>
          <header>
            <h3>Sets per muscle group</h3>
            <span className={styles.subtle}>Completed sets only</span>
          </header>
          <div className={styles.chartCard}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={setsPerMuscle || []}>
                <CartesianGrid strokeDasharray="4 8" stroke="#e2e8f0" />
                <XAxis dataKey="muscle_group" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="sets" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <header>
            <h3>Intensity distribution</h3>
            <span className={styles.subtle}>Tracked rep ranges</span>
          </header>
          <div className={styles.chartCard}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={intensity || []}>
                <CartesianGrid strokeDasharray="4 8" stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="sets" fill="#f97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}

export default StatsView;
