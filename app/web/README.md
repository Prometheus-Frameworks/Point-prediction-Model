# Decision Board Frontend

## Frontend
This frontend is a read-only UI for the Point Prediction Model decision board, with a live API-backed happy path and a local mock fallback.

## Local development
```bash
npm install
npm run dev
```

Then open the local Vite URL, typically `http://localhost:5173`.

## Run with the backend locally
From the repo root in one terminal:
```bash
npm run dev:api
```

From `app/web/` in another terminal:
```bash
cp .env.example .env
npm install
npm run dev
```

Default local URLs:
- frontend: `http://localhost:5173`
- backend: `http://localhost:3000`

## Build
```bash
npm run build
```

## Preview
```bash
npm run preview -- --host 0.0.0.0 --port 4173
```

## Environment
Create a `.env` file from `.env.example` and set:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

To point the frontend at the live Railway API instead:

```bash
VITE_API_BASE_URL=https://<your-railway-api>.up.railway.app
```

## API usage
- `src/config.ts` centralizes the frontend API base URL.
- `src/api/client.ts` builds fetch requests from `VITE_API_BASE_URL`.
- `src/api/decisionBoard.ts` loads `/api/decision-board/mock`.
- `src/hooks/useDecisionBoard.ts` manages loading, error, empty, and fallback behavior.
- The main happy path is API-backed.
- `src/data/mockDecisionBoard.ts` remains available as a fallback for local/offline UI work.

## UI states
The app now renders readable states for:
- loading live decision-board data
- live API failures, while falling back to local mock data
- successful but empty API responses
- filter combinations that hide all current rows

## Boundaries
- Frontend code lives entirely under `app/web/`.
- The frontend consumes backend data over HTTP.
- The frontend must not import runtime server code from `src/server.ts`.
- Backend code under `src/` must not import frontend modules.
