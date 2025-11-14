"use client"

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { learnersAPI, ValidationResponse, BulkImportResponse } from '@/lib/api/learners';
import { toast } from 'sonner';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        toast.error('Format de fichier invalide', {
          description: 'Veuillez sélectionner un fichier CSV'
        });
        return;
      }
      setFile(selectedFile);
      setValidationResult(null);
    }
  };

  const handleValidation = async () => {
    if (!file) return;

    setIsValidating(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await learnersAPI.validateBulkImport(formData);
      setValidationResult(result);

      if (result.isValid) {
        toast.success('Validation réussie', {
          description: `${result.validRows} apprenants valides sur ${result.totalRows}`
        });
      } else {
        toast.warning('Erreurs de validation détectées', {
          description: `${result.errors?.length || 0} erreur(s) trouvée(s)`
        });
      }
    } catch (error: any) {
      console.error('Validation error:', error);
      toast.error('Erreur de validation', {
        description: error.message || 'Impossible de valider le fichier'
      });
      setValidationResult(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dryRun', 'false');

      const result = await learnersAPI.bulkImport(formData);

      toast.success('Import réussi', {
        description: `${result.successfulImports} apprenants importés avec succès sur ${result.totalProcessed}`
      });

      if (result.failedImports > 0) {
        toast.warning('Certains imports ont échoué', {
          description: `${result.failedImports} apprenants n'ont pas pu être importés`
        });
      }

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('Erreur lors de l\'import', {
        description: error.message || 'Impossible d\'importer les apprenants'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const csvContent = await learnersAPI.downloadCSVTemplate();
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'template_import_apprenants.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Template téléchargé avec succès');
    } catch (error: any) {
      console.error('Template download error:', error);
      toast.error('Erreur lors du téléchargement du template', {
        description: error.message
      });
    }
  };

  const handleClose = () => {
    setFile(null);
    setValidationResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <Dialog.Title className="text-xl font-semibold text-gray-900">
              Import en masse d'apprenants
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {/* Download template */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <FileText className="text-blue-500 mt-0.5" size={20} />
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-blue-900">
                    Template CSV
                  </h3>
                  <p className="mt-1 text-sm text-blue-700">
                    Téléchargez le template CSV pour voir le format requis
                  </p>
                  <button
                    onClick={handleDownloadTemplate}
                    className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <Download size={16} className="mr-1" />
                    Télécharger le template
                  </button>
                </div>
              </div>
            </div>

            {/* File upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner un fichier CSV
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-orange-400 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500">
                      <span>Choisir un fichier</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept=".csv"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">ou glisser-déposer</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Fichiers CSV uniquement, jusqu'à 10MB
                  </p>
                </div>
              </div>
              {file && (
                <div className="mt-2 text-sm text-gray-600">
                  Fichier sélectionné: <span className="font-medium">{file.name}</span>
                  <span className="text-gray-400 ml-2">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>

            {/* Validation results */}
            {validationResult && (
              <div className={`rounded-lg p-4 ${
                validationResult.isValid 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start">
                  {validationResult.isValid ? (
                    <CheckCircle className="text-green-500 mt-0.5" size={20} />
                  ) : (
                    <AlertCircle className="text-red-500 mt-0.5" size={20} />
                  )}
                  <div className="ml-3 flex-1">
                    <h3 className={`text-sm font-medium ${
                      validationResult.isValid ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {validationResult.isValid 
                        ? 'Validation réussie' 
                        : 'Erreurs détectées'}
                    </h3>
                    <div className="mt-2 text-sm">
                      <p className={validationResult.isValid ? 'text-green-700' : 'text-red-700'}>
                        {validationResult.validRows} lignes valides sur {validationResult.totalRows}
                      </p>
                      {validationResult.errors && validationResult.errors.length > 0 && (
                        <div className="mt-2 max-h-32 overflow-y-auto">
                          <details>
                            <summary className="cursor-pointer text-red-700 hover:text-red-900">
                              Voir les erreurs ({validationResult.errors.length})
                            </summary>
                            <ul className="mt-2 list-disc list-inside space-y-1 text-red-700 text-xs">
                              {validationResult.errors.map((error: string, index: number) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            {file && !validationResult && (
              <button
                onClick={handleValidation}
                disabled={isValidating}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isValidating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Validation...
                  </>
                ) : (
                  'Valider le fichier'
                )}
              </button>
            )}
            {validationResult?.isValid && (
              <button
                onClick={handleImport}
                disabled={isUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Import en cours...
                  </>
                ) : (
                  `Importer ${validationResult.validRows} apprenants`
                )}
              </button>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}