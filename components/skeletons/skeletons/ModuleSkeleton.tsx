export function ModuleDetailsSkeleton() {
  return (
    <div className="bg-teal-500 rounded-lg shadow-lg p-1 animate-pulse">
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-start gap-6">
          {/* Module Image Skeleton */}
          <div className="w-32 h-32 rounded-lg bg-gray-200 flex-shrink-0"></div>

          <div className="flex-grow">
            {/* Title and Description Skeleton */}
            <div className="mb-6">
              <div className="h-8 bg-gray-200 rounded mb-2 w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mt-2"></div>
            </div>

            {/* Info Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gray-200 w-9 h-9"></div>
                  <div className="flex-grow">
                    <div className="h-3 bg-gray-200 rounded mb-1 w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons Skeleton */}
          <div className="flex flex-col space-y-2">
            <div className="w-24 h-10 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GradesTableSkeleton() {
  return (
    <div className="mt-8 bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 animate-pulse">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-200">
        <div className="h-6 bg-gray-300 rounded w-48"></div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Apprenant', 'Note', 'État', 'Commentaire', 'Actions'].map((header, i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex-shrink-0"></div>
                    <div className="ml-4">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="h-8 bg-gray-200 rounded w-20 ml-auto"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ModuleCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="h-48 bg-gray-200"></div>
      
      {/* Content Skeleton */}
      <div className="p-6">
        <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded mb-4 w-full"></div>
        <div className="h-4 bg-gray-200 rounded mb-4 w-2/3"></div>
        
        {/* Stats Skeleton */}
        <div className="flex items-center justify-between text-sm">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}