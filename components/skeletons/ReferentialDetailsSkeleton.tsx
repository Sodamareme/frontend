export const ReferentialDetailsSkeleton = () => (
  <div className="animate-pulse">
    {/* Header Skeleton */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-gray-200 rounded-lg mr-4" />
        <div className="flex items-center">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="mx-2 text-gray-400">/</div>
          <div className="h-6 w-24 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="flex items-start space-x-6">
        <div className="w-24 h-24 bg-gray-200 rounded-lg" />
        <div>
          <div className="h-8 w-64 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-96 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
    
    {/* Modules Grid Skeleton */}
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-32 bg-gray-200 rounded" />
        <div className="h-6 w-24 bg-gray-200 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-32 bg-gray-200" />
            <div className="p-4">
              <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-full bg-gray-200 rounded mb-3" />
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);