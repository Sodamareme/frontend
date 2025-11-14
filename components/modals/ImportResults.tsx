import React from 'react';
import { ImportResponse, ValidationError } from '../../lib/types/import';
import { CheckCircle, XCircle, AlertTriangle, Download, RefreshCw } from 'lucide-react';

interface ImportResultsProps {
  results: ImportResponse;
  onNewImport: () => void;
  onExportResults: () => void;
}

export const ImportResults: React.FC<ImportResultsProps> = ({
  results,
  onNewImport,
  onExportResults
}) => {
  const [expandedErrors, setExpandedErrors] = React.useState<Set<number>>(new Set());

  const toggleErrorDetails = (index: number) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedErrors(newExpanded);
  };

  const getStatusIcon = (success: boolean, hasWarnings: boolean) => {
    if (success && hasWarnings) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    if (success) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = (success: boolean, hasWarnings: boolean) => {
    if (success && hasWarnings) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Avertissement</span>;
    }
    if (success) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Succès</span>;
    }
    return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Échec</span>;
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Résumé de l'importation
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{results.totalProcessed}</div>
            <div className="text-sm text-gray-500">Total traité</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{results.successfulImports}</div>
            <div className="text-sm text-gray-500">Réussis</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{results.failedImports}</div>
            <div className="text-sm text-gray-500">Échecs</div>
          </div>
        </div>

        {results.summary && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-900">{results.summary.duplicateEmails}</div>
                <div className="text-gray-500">Emails dupliqués</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">{results.summary.duplicatePhones}</div>
                <div className="text-gray-500">Téléphones dupliqués</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">{results.summary.missingReferentials}</div>
                <div className="text-gray-500">Référentiels manquants</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">{results.summary.sessionCapacityWarnings}</div>
                <div className="text-gray-500">Avert. capacité</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={onNewImport}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Nouvel import
        </button>
        <button
          onClick={onExportResults}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Download className="h-4 w-4 mr-2" />
          Exporter les résultats
        </button>
      </div>

      {/* Detailed Results */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-base font-semibold text-gray-900">
            Résultats détaillés
          </h4>
        </div>
        
        <div className="divide-y divide-gray-200">
          {results.results.map((result, index) => (
            <div key={index} className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getStatusIcon(result.success, !!result.warnings?.length)}
                </div>
                
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h5 className="text-sm font-medium text-gray-900">
                          {result.firstName} {result.lastName}
                        </h5>
                        {getStatusBadge(result.success, !!result.warnings?.length)}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{result.email}</p>
                    </div>
                    
                    {result.success && (
                      <div className="text-right">
                        {result.matricule && (
                          <div className="text-sm font-medium text-gray-900">
                            {result.matricule}
                          </div>
                        )}
                        {result.learnerId && (
                          <div className="text-xs text-gray-500">
                            ID: {result.learnerId}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Success warnings */}
                  {result.success && result.warnings && result.warnings.length > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="text-sm text-yellow-800">
                        <strong>Avertissements:</strong>
                        <ul className="mt-1 list-disc list-inside">
                          {result.warnings.map((warning, idx) => (
                            <li key={idx}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Error details */}
                  {!result.success && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-red-600">{result.error}</p>
                        {result.validationErrors && result.validationErrors.length > 0 && (
                          <button
                            onClick={() => toggleErrorDetails(index)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            {expandedErrors.has(index) ? 'Masquer' : 'Voir'} détails
                          </button>
                        )}
                      </div>

                      {expandedErrors.has(index) && result.validationErrors && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                          <div className="text-sm text-red-800">
                            <strong>Erreurs de validation:</strong>
                            <ul className="mt-2 space-y-1">
                              {result.validationErrors.map((error: ValidationError, idx) => (
                                <li key={idx} className="text-xs">
                                  <span className="font-medium">{error.field}:</span> {error.message}
                                  {error.value && (
                                    <span className="text-gray-600"> (valeur: "{error.value}")</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};