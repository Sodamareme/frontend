export type MealType = 'BREAKFAST' | 'LUNCH';

export type MealWindow =
  | {
      allowed: false;
      detectedType: null;
      label: 'Scan interdit';
      helpText: string;
    }
  | {
      allowed: true;
      detectedType: MealType;
      label: string;
      helpText: string;
    };

export const BUSINESS_TIMEZONE = 'Africa/Dakar';

function getTimeParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const values = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  return {
    hour: Number(values.hour ?? '0'),
    minute: Number(values.minute ?? '0'),
  };
}

export function getMealWindow(now: Date = new Date(), timeZone: string = BUSINESS_TIMEZONE): MealWindow {
  const { hour, minute } = getTimeParts(now, timeZone);
  const totalMinutes = hour * 60 + minute;

  if (totalMinutes < 6 * 60) {
    return {
      allowed: false,
      detectedType: null,
      label: 'Scan interdit',
      helpText: "Le scan n'est pas autorise entre 00h et 06h.",
    };
  }

  if (totalMinutes < 11 * 60) {
    return {
      allowed: true,
      detectedType: 'BREAKFAST',
      label: 'Petit déjeuner',
      helpText: 'De 06h à 11h, le repas détecté par défaut est le petit-déjeuner.',
    };
  }

  return {
    allowed: true,
    detectedType: 'LUNCH',
    label: 'Déjeuner',
    helpText: 'De 11h à 00h, le repas détecté par défaut est le déjeuner.',
  };
}

export function getMealLabel(type: MealType) {
  return type === 'BREAKFAST' ? 'Petit déjeuner' : 'Déjeuner';
}
