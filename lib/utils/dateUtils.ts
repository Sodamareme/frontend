/**
 * Utilitaires pour la gestion des dates
 */

/**
 * Vérifie si deux dates sont le même jour
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Parse une chaîne de date au format YYYY-MM-DD vers un objet Date
 */
export function parseDateString(dateString: string): Date {
  const date = new Date(dateString + 'T00:00:00.000Z');
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
}

/**
 * Formate une date pour l'affichage (format français)
 */
export function formatDateForDisplay(dateInput: string | Date): string {
  let date: Date;
  
  if (typeof dateInput === 'string') {
    date = parseDateString(dateInput);
  } else {
    date = dateInput;
  }
  
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formate une date vers une chaîne au format YYYY-MM-DD
 */
export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtient la date d'aujourd'hui au format YYYY-MM-DD
 */
export function getTodayString(): string {
  return formatDateToString(new Date());
}

/**
 * Vérifie si une date est aujourd'hui
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Calcule la différence en jours entre deux dates
 */
export function daysDifference(date1: Date, date2: Date): number {
  const timeDiff = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
}

/**
 * Formate une heure pour l'affichage
 */
export function formatTimeForDisplay(date: Date): string {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}