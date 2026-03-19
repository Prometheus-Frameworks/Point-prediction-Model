# Decision Board Frontend

## Frontend
This frontend is a read-only UI for the Point Prediction Model decision board.

## Local development
```bash
npm install
npm run dev
```

Then open the local Vite URL, typically `http://localhost:5173`.

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

The UI can continue using mock/example data during development, but future API-backed views should read from `VITE_API_BASE_URL` rather than hardcoding URLs.

## API base URL usage
- `src/config.ts` centralizes the frontend API base URL.
- The current UI still uses mock decision-board data for a read-only experience.
- Future data-fetching helpers should build requests from `appConfig.apiBaseUrl` so deployment remains environment-driven.

## Boundaries
- Frontend code lives entirely under `app/web/`.
- The frontend should consume backend data over HTTP.
- The frontend must not import runtime server code from `src/server.ts`.
- Backend code under `src/` must not import frontend modules.

## Future integration plan
A later PR can replace `src/data/mockDecisionBoard.ts` with a typed adapter that maps real service outputs into this display shape. The near-term plan is to swap mock data for API-backed responses without changing the frontend's deployment boundary or bundling the frontend into the backend runtime.
