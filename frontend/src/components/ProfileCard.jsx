import { Link } from 'react-router-dom';
import { useProfileSummary } from '../api/hooks';
import { formatDate, formatNumber } from '../utils/format';
import styles from '../styles/ProfileCard.module.css';

function ProfileCard({ profile }) {
  const { data: summary, isLoading } = useProfileSummary(profile.id);

  return (
    <Link to={`/profile/${profile.id}`} className={styles.card}>
      <div className={styles.header}>
        <span className={styles.name}>{profile.name}</span>
        <span className={styles.subtitle}>Hypertrophy focus</span>
      </div>
      <div className={styles.metrics}>
        <div>
          <span className={styles.metricLabel}>Last session</span>
          <span className={styles.metricValue}>
            {isLoading ? 'Loading…' : formatDate(summary?.last_session_at)}
          </span>
        </div>
        <div>
          <span className={styles.metricLabel}>Last week volume</span>
          <span className={styles.metricValue}>
            {isLoading ? '—' : `${formatNumber(summary?.last_week_tonnage || 0)} lbs`}
          </span>
        </div>
        <div>
          <span className={styles.metricLabel}>Adherence</span>
          <span className={styles.metricValue}>
            {isLoading || summary?.adherence_percentage == null
              ? '—'
              : `${summary.adherence_percentage}%`}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default ProfileCard;
