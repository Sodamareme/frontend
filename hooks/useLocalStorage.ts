// hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // État pour stocker la valeur
  const [storedValue, setStoredValue] = useState<T>(() => {
    // Ne pas accéder à localStorage pendant le SSR
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      
      // Parser les données stockées ou retourner la valeur initiale
      if (item) {
        const parsed = JSON.parse(item);
        
        // Reconvertir les dates si nécessaire
        if (key === 'restaurant_scan_results' && Array.isArray(parsed)) {
          return parsed.map((result: any) => ({
            ...result,
            scanTime: new Date(result.scanTime)
          })) as T;
        }
        
        return parsed;
      }
      
      return initialValue;
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Fonction pour mettre à jour la valeur
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permettre à value d'être une fonction
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Sauvegarder l'état
      setStoredValue(valueToStore);
      
      // Sauvegarder dans localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error saving localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

// Hook spécifique pour les résultats de scan
export function useScanResults() {
  return useLocalStorage<ScanResult[]>('restaurant_scan_results', []);
}

// Hook spécifique pour les statistiques de repas
export function useMealStats() {
  const TOTAL_LEARNERS = 250;
  
  return useLocalStorage('restaurant_meal_stats', {
    totalLearners: TOTAL_LEARNERS,
    breakfast: 0,
    lunch: 0,
  });
}
