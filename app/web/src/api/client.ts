import { appConfig } from '../config';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const buildUrl = (path: string) => {
  const normalizedBaseUrl = trimTrailingSlash(appConfig.apiBaseUrl);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
};

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const getJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(buildUrl(path), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}.`, response.status);
  }

  return (await response.json()) as T;
};
