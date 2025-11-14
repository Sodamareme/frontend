// utils/export.ts
import { toast } from "sonner"

// Fonction utilitaire pour convertir les données en CSV
const convertToCSV = (data: Record<string, any>[]) => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
};

export const exportToCSV = (data: Record<string, any>[], filename: string) => {
  try {
    const csvContent = convertToCSV(data);
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Export réussi', {
        description: `${data.length} éléments exportés avec succès`,
      });
    }
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    toast.error('Erreur lors de l\'export', {
      description: 'Une erreur est survenue lors de l\'export des données',
    });
  }
};