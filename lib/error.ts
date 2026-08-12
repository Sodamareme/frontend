import axios from 'axios';

export const DEFAULT_USER_ERROR_MESSAGE =
  'Une erreur est survenue. Veuillez réessayer dans quelques instants.';

const TECHNICAL_PATTERNS: RegExp[] = [
  /axioserror/i,
  /request failed with status code/i,
  /network error/i,
  /failed to fetch/i,
  /fetch failed/i,
  /http error/i,
  /internal server error/i,
  /server error/i,
  /cannot get \//i,
  /forbidden resource/i,
  /failed to find server action/i,
  /prisma/i,
  /sqlstate/i,
  /validation error count/i,
  /eces/i,
  /eacces/i,
  /etypeerror/i,
  /referenceerror/i,
  /syntaxerror/i,
  /unhandled/i,
  /stack trace/i,
  /traceback/i,
  /undefined is not a function/i,
  /cannot read properties of/i,
  /invalid `?prisma/i,
  /invalid response format/i,
];

const FRIENDLY_STATUS_MESSAGES: Record<number, string> = {
  400: 'La demande est invalide. Veuillez vérifier les informations saisies.',
  401: 'Votre session a expiré. Veuillez vous reconnecter.',
  403: 'Vous n’avez pas les permissions nécessaires pour effectuer cette action.',
  404: 'La ressource demandée est introuvable.',
  408: 'La requête a pris trop de temps. Veuillez réessayer.',
  429: 'Trop de tentatives. Veuillez réessayer plus tard.',
  500: 'Le serveur rencontre un problème. Veuillez réessayer plus tard.',
  502: 'Le service est momentanément indisponible.',
  503: 'Le service est momentanément indisponible.',
  504: 'Le serveur met trop de temps à répondre.',
};

function flattenMessage(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => flattenMessage(item))
      .filter(Boolean)
      .join(' | ');
  }

  if (value && typeof value === 'object') {
    const maybeMessage = (value as { message?: unknown }).message;
    if (maybeMessage !== undefined) {
      return flattenMessage(maybeMessage);
    }

    const maybeError = (value as { error?: unknown }).error;
    if (maybeError !== undefined) {
      return flattenMessage(maybeError);
    }
  }

  return '';
}

export function isTechnicalErrorMessage(message: string): boolean {
  const normalized = message.trim();
  if (!normalized) return false;
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function normalizeUserMessage(
  message: unknown,
  fallback: string = DEFAULT_USER_ERROR_MESSAGE,
): string {
  const flattened = flattenMessage(message);
  if (!flattened) {
    return fallback;
  }

  if (isTechnicalErrorMessage(flattened)) {
    return fallback;
  }

  return flattened;
}

export function getUserFriendlyErrorMessage(
  error: unknown,
  fallback: string = DEFAULT_USER_ERROR_MESSAGE,
): string {
  if (!error) {
    return fallback;
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const responseData = error.response?.data as
      | { message?: unknown; error?: unknown; fieldErrors?: unknown }
      | undefined;

    if (responseData?.fieldErrors) {
      const fieldErrors = flattenMessage(responseData.fieldErrors);
      if (fieldErrors) {
        return fieldErrors;
      }
    }

    const candidateMessage = flattenMessage(
      responseData?.message ?? responseData?.error ?? error.message,
    );

    if (candidateMessage && !isTechnicalErrorMessage(candidateMessage)) {
      return candidateMessage;
    }

    if (status && FRIENDLY_STATUS_MESSAGES[status]) {
      return FRIENDLY_STATUS_MESSAGES[status];
    }

    return fallback;
  }

  if (error instanceof Error) {
    const candidateMessage = flattenMessage(error.message);
    if (candidateMessage && !isTechnicalErrorMessage(candidateMessage)) {
      return candidateMessage;
    }
  }

  const genericMessage = flattenMessage(
    typeof error === 'object' && error !== null
      ? (error as { message?: unknown; error?: unknown }).message ??
          (error as { message?: unknown; error?: unknown }).error
      : error,
  );

  if (genericMessage && !isTechnicalErrorMessage(genericMessage)) {
    return genericMessage;
  }

  return fallback;
}

export function sanitizeAxiosError<T extends { response?: { data?: any; status?: number }; message?: string }>(
  error: T,
  fallback?: string,
): T {
  const userMessage = getUserFriendlyErrorMessage(error, fallback);

  if (error && typeof error === 'object') {
    error.message = userMessage;

    if (error.response?.data && typeof error.response.data === 'object') {
      error.response.data.message = userMessage;
    }
  }

  return error;
}
