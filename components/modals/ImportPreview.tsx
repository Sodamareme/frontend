import React from 'react';
import { Learner } from '../../lib/types/import';
import { Eye, EyeOff } from 'lucide-react';

interface ImportPreviewProps {
  data: Learner[];
  onProceed: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export const ImportPreview: React.FC<ImportPreviewProps> = ({
  data,
  onProceed,
  onCancel,
  isProcessing = false
}) => {
  const [showSensitive, setShowSensitive] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5;
  
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  const maskEmail = (email: string) => {
    if (showSensitive) return email;
    const [name, domain] = email.split('@');
    return `${name.substring(0, 2)}***@${domain}`;
  };

  const maskPhone = (phone: string) => {
    if (showSensitive) return phone;
    return phone.substring(0, 4) + '***' + phone.substring(phone.length - 3);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Prévisualisation des données
          </h3>
          <p className="text-sm text-gray-600">
            {data.length} apprenant{data.length > 1 ? 's' : ''} trouvé{data.length > 1 ? 's' : ''}
          </p>
        </div>
        
        <button
          onClick={() => setShowSensitive(!showSensitive)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {showSensitive ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Masquer les données
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Afficher les données
            </>
          )}
        </button>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Apprenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Détails
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tuteur
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((learner, index) => (
                <tr key={startIndex + index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {learner.firstName} {learner.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {learner.gender} • {new Date(learner.birthDate).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {maskEmail(learner.email)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {maskPhone(learner.phone)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {learner.promotionId}
                    </div>
                    <div className="text-sm text-gray-500">
                      {learner.birthPlace}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {learner.tutorFirstName} {learner.tutorLastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {maskPhone(learner.tutorPhone)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Affichage {startIndex + 1} à {Math.min(startIndex + itemsPerPage, data.length)} sur {data.length} résultats
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Précédent
            </button>
            <span className="px-3 py-1 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-md">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Annuler
        </button>
        <button
          onClick={onProceed}
          disabled={isProcessing}
          className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Importation...' : `Importer ${data.length} apprenant${data.length > 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
};