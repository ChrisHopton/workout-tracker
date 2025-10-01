import { useProfiles } from '../api/hooks';
import ProfileCard from '../components/ProfileCard';
import styles from '../styles/HomePage.module.css';

function HomePage() {
  const { data: profiles, isLoading } = useProfiles();

  return (
    <div className="container">
      <section className={styles.hero}>
        <div>
          <h1>Choose your hypertrophy journey</h1>
          <p>Tap a profile to review the weekly plan, monitor stats, and launch workouts instantly.</p>
        </div>
      </section>
      <section className={styles.profileGrid}>
        {isLoading && <div className={styles.loading}>Loading profiles…</div>}
        {profiles?.length ? (
          profiles.map((profile) => <ProfileCard key={profile.id} profile={profile} />)
        ) : (
          !isLoading && <p className={styles.empty}>No profiles yet.</p>
        )}
      </section>
    </div>
  );
}

export default HomePage;
