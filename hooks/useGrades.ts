// hooks/useGrades.ts
import { useState, useEffect, useCallback } from 'react';
import { gradeService, Grade, CreateGradeData, UpdateGradeData, GradeStats } from '../lib/gradeService';

export const useGrades = (moduleId: number) => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGrades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await gradeService.getGradesByModule(moduleId);
      setGrades(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des notes');
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  const createOrUpdateGrade = async (data: CreateGradeData): Promise<Grade> => {
    try {
      const grade = await gradeService.upsertGrade(data);
      await fetchGrades(); // Recharger les données
      return grade;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteGrade = async (id: number): Promise<void> => {
    try {
      await gradeService.deleteGrade(id);
      await fetchGrades(); // Recharger les données
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getGradeForLearner = (learnerId: number): Grade | undefined => {
    return grades.find(grade => grade.learnerId === learnerId);
  };

  return {
    grades,
    loading,
    error,
    fetchGrades,
    createOrUpdateGrade,
    deleteGrade,
    getGradeForLearner,
  };
};

export const useGradeStats = (moduleId: number) => {
  const [stats, setStats] = useState<GradeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await gradeService.getModuleGradeStats(moduleId);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats,
  };
};