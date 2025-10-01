import { Routes, Route, Navigate, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProfileDashboardPage from './pages/ProfileDashboardPage';
import StartWorkoutPage from './pages/StartWorkoutPage';
import styles from './styles/AppLayout.module.css';
import { ToastProvider } from './components/ToastProvider';

function App() {
  return (
    <ToastProvider>
      <div className={styles.appShell}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <Link to="/" className={styles.brand}>
              Hypertrophy Tracker
            </Link>
            <span className={styles.tagline}>Raspberry Pi-ready training for up to three athletes</span>
          </div>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile/:profileId" element={<ProfileDashboardPage />} />
            <Route path="/workout/:workoutId/start" element={<StartWorkoutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}

export default App;
