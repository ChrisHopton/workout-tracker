# Hypertrophy Workout Tracker

A Raspberry Pi-friendly hypertrophy training tracker for up to three local users. The stack pairs a Vite + React SPA with an Express/Knex API backed by MariaDB. Two pre-seeded profiles (Male/Female) ship with hypertrophy templates, demo sessions, and fully aggregated stat dashboards (volume, e1RM, sets per muscle group, intensity distribution, and adherence).

## Features

- **Profile-based experience** – Hard-coded Male and Female profiles with quick KPI summaries and seeded UL/UL/PPL workouts.
- **Weekly plan grid** – Interactive week selector showing prescribed exercises, sets, reps, target weights, and direct links to start each workout.
- **Workout logging** – Guided set-by-set inputs with skip handling that records `NULL` actuals so statistics remain clean.
- **Hypertrophy analytics** – Server-side aggregations for rolling tonnage, best e1RM, adherence, volume trends, sets per muscle group, and intensity buckets.
- **React Query caching** – Responsive UI with optimistic feedback and toast notifications.
- **Dockerised for Raspberry Pi** – Compose stack with MariaDB 10.11, Node 20 Alpine API, and Vite preview server.

## Getting started (local dev)

1. **Install dependencies**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Run services**
   - Start MariaDB (e.g., via Docker or local install) and ensure the credentials in `.env` match.
   - API: `cd backend && npm run dev`
   - Frontend: `cd ../frontend && npm run dev`

   The Vite dev server proxies `/api` calls to `http://localhost:3001` by default.

4. **Database migrations & seeds**
   The API automatically runs migrations and seeds on start. You can also trigger them manually:
   ```bash
   cd backend
   npm run migrate
   npm run seed
   ```

## Docker Compose deployment

For a Pi-friendly deployment the repo ships with a ready-to-run compose stack.

```bash
cp .env.example .env
docker compose up --build
```

Services:
- **db** – MariaDB 10.11 with persisted volume `db_data`.
- **api** – Express/Knex API on port `3001` (auto-runs migrations + seeds).
- **web** – Vite build + preview server on port `3000` (builds with `VITE_API_URL=http://api:3001/api/v1`).

Access the UI at [http://localhost:3000](http://localhost:3000).

## Key scripts

| Location  | Script          | Description                               |
|-----------|-----------------|-------------------------------------------|
| backend   | `npm run dev`   | Nodemon-powered API with hot reload       |
| backend   | `npm run migrate` / `npm run seed` | Apply schema and seed data |
| frontend  | `npm run dev`   | Vite dev server                           |
| frontend  | `npm run build` | Optimised static build                    |
| frontend  | `npm run preview` | Serve built SPA (used in Docker)        |

## API overview ( `/api/v1` )

- `GET /profiles` – List profiles.
- `GET /profiles/:id/summary` – Quick KPIs (last session, tonnage, adherence).
- `GET /profiles/:id/week?start=YYYY-MM-DD` – Weekly plan with exercises and prescriptions.
- `GET /profiles/:id/sessions` – Historical sessions by date range.
- `POST /sessions` – Start a workout session.
- `POST /sessions/:id/sets/bulk` – Upsert actual set results (supports skipped sets).
- `POST /sessions/:id/finish` – Close a session.
- `GET /stats/profiles/:id/overview?window=weeks:n` – Aggregated KPIs with top exercises.
- `GET /stats/profiles/:id/volume` – Weekly volume trend.
- `GET /stats/profiles/:id/e1rm` – Exercise e1RM trends.
- `GET /stats/profiles/:id/sets-per-muscle` – Sets by muscle group.
- `GET /stats/profiles/:id/intensity` – Intensity distribution buckets.
- `GET /exercises` – Exercise catalogue.

## Data model

Knex migrations define the following tables (all InnoDB):

- `profiles`, `workouts`, `exercises`, `workout_exercises`, `prescriptions`
- `sessions`, `session_sets` (actuals with NULL-aware skip logic)
- `bodyweight_logs`, `settings`

Seeds populate both profiles, the exercise catalogue, weekly workouts for the current ISO week, and demo sessions for chart data.

## Notes

- Stats ignore any set with NULL reps or weight (skipped sets) to maintain clean adherence/volume metrics.
- CORS defaults to `http://localhost:3000`, `5173`, and `4173`. Override with `CORS_ORIGIN` in `.env`.
- Frontend uses CSS modules for a lightweight responsive UI suitable for small displays.
- For screenshots or UI tweaks in Docker deployments, rebuild the `web` service to regenerate the static bundle.
