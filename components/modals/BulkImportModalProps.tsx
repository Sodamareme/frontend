import React, { useState } from 'react';
import { FileUpload } from '../modals/FileUpload';
import { ImportPreview } from '../modals/ImportPreview';
import { ImportResults } from '../modals/ImportResults';
import { importService } from '../services/importService';
import { BulkCreateLearnerDto, BulkImportResponseDto } from '../../lib/types/bulk-import';
import { X, Upload, Users, BarChart3 } from 'lucide-react';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (results: BulkImportResponseDto) => void;
}

type Step = 'upload' | 'preview' | 'results';

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [parsedData, setParsedData] = useState<BulkCreateLearnerDto[]>([]);
  const [importResults, setImportResults] = useState<BulkImportResponseDto | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    try {
      const text = await file.text();
      const data = importService.parseBulkCSV(text);
      setParsedData(data);
      setCurrentStep('preview');
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Erreur lors du traitement du fichier. Vérifiez le format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSample = () => {
    const csv = importService.generateBulkSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modele_import_apprenants.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleProceedImport = async () => {
    setIsProcessing(true);
    try {
      const results = await importService.processBulkLearners(parsedData);
      setImportResults(results);
      setCurrentStep('results');
      onImportComplete?.(results);
    } catch (error) {
      console.error('Import error:', error);
      alert('Erreur lors de l\'importation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelPreview = () => {
    setCurrentStep('upload');
    setParsedData([]);
  };

  const handleNewImport = () => {
    setCurrentStep('upload');
    setParsedData([]);
    setImportResults(null);
  };

  const handleExportResults = () => {
    if (!importResults) return;
    
    const csvData = [
      ['Email', 'Prénom', 'Nom', 'Statut', 'Matricule', 'ID Apprenant', 'Erreur', 'Avertissements'],
      ...importResults.results.map(r => [
        r.email,
        r.firstName || '',
        r.lastName || '',
        r.success ? 'Succès' : 'Échec',
        r.matricule || '',
        r.learnerId || '',
        r.error || '',
        r.warnings?.join('; ') || ''
      ])
    ];
    
    const csv = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultats_import_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStepIcon = (step: Step) => {
    switch (step) {
      case 'upload':
        return <Upload className="h-5 w-5" />;
      case 'preview':
        return <Users className="h-5 w-5" />;
      case 'results':
        return <BarChart3 className="h-5 w-5" />;
    }
  };

  const steps = [
    { key: 'upload', label: 'Téléchargement', description: 'Sélectionner le fichier' },
    { key: 'preview', label: 'Prévisualisation', description: 'Vérifier les données' },
    { key: 'results', label: 'Résultats', description: 'Voir les résultats' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Import en lot d'apprenants
              </h2>
              <p className="text-sm text-gray-600">
                Importez plusieurs apprenants depuis un fichier CSV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <nav className="flex items-center justify-center">
            <ol className="flex items-center space-x-4">
              {steps.map((step, index) => {
                const isActive = currentStep === step.key;
                const isCompleted = steps.findIndex(s => s.key === currentStep) > index;
                
                return (
                  <li key={step.key} className="flex items-center">
                    <div className="flex items-center space-x-2">
                      <div className={`
                        flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                        ${isActive 
                          ? 'bg-blue-600 text-white' 
                          : isCompleted 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-200 text-gray-500'
                        }
                      `}>
                        {isCompleted ? '✓' : index + 1}
                      </div>
                      <div className="text-left">
                        <div className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                          {step.label}
                        </div>
                        <div className="text-xs text-gray-400">
                          {step.description}
                        </div>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`ml-4 w-8 h-0.5 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`} />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {currentStep === 'upload' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                {getStepIcon('upload')}
                <span className="ml-2">Téléchargement du fichier</span>
              </h3>
              <FileUpload
                onFileSelect={handleFileSelect}
                onDownloadSample={handleDownloadSample}
                isLoading={isProcessing}
                acceptedTypes=".csv"
              />
            </div>
          )}

          {currentStep === 'preview' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                {getStepIcon('preview')}
                <span className="ml-2">Prévisualisation des données</span>
              </h3>
              <ImportPreview
                data={parsedData}
                onProceed={handleProceedImport}
                onCancel={handleCancelPreview}
                isProcessing={isProcessing}
              />
            </div>
          )}

          {currentStep === 'results' && importResults && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                {getStepIcon('results')}
                <span className="ml-2">Résultats de l'importation</span>
              </h3>
              <ImportResults
                results={importResults}
                onNewImport={handleNewImport}
                onExportResults={handleExportResults}
              />
            </div>
          )}
        </div>
      </div>l
    </div>
  );
};