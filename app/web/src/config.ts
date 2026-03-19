const fallbackApiBaseUrl = 'http://localhost:3000';

export const appConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || fallbackApiBaseUrl,
  usesMockData: true,
} as const;
