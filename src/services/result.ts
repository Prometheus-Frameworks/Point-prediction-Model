export interface ServiceWarning {
  code: string;
  message: string;
  details?: unknown;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ServiceSuccess<T> {
  ok: true;
  data: T;
  warnings: ServiceWarning[];
  errors: [];
}

export interface ServiceFailure {
  ok: false;
  warnings: ServiceWarning[];
  errors: ServiceError[];
}

export type ServiceResult<T> = ServiceSuccess<T> | ServiceFailure;

export const serviceSuccess = <T>(data: T, warnings: ServiceWarning[] = []): ServiceSuccess<T> => ({
  ok: true,
  data,
  warnings,
  errors: [],
});

export const serviceFailure = (
  errors: ServiceError | ServiceError[],
  warnings: ServiceWarning[] = [],
): ServiceFailure => ({
  ok: false,
  warnings,
  errors: Array.isArray(errors) ? errors : [errors],
});

export const mergeServiceWarnings = (...warningSets: ServiceWarning[][]): ServiceWarning[] =>
  warningSets.flat();
