'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';

interface Column {
  header: string;
  accessorKey: string;
  cell?: (value: any, row?: any) => React.ReactNode;
}

interface TableProps {
  columns: Column[];
  data: any[];
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  totalItems?: number;
  isLoading?: boolean;
  renderRowActions?: (row: any) => React.ReactNode;
  onItemsPerPageChange?: (value: number) => void;
  totalPages?: number;
}

export const Table = ({
  columns,
  data,
  itemsPerPage = 10,
  currentPage = 1,
  totalItems = 0,
  isLoading = false,
  renderRowActions,
  onPageChange,
  onItemsPerPageChange,
  totalPages = 0
}: TableProps) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const calculatedTotalPages = totalPages || Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Generate page numbers for pagination
  const generatePaginationItems = () => {
    const maxVisiblePages = 5;
    const pages = [];
    
    if (calculatedTotalPages <= maxVisiblePages) {
      // Show all pages if there are fewer than maxVisiblePages
      for (let i = 1; i <= calculatedTotalPages; i++) {
        pages.push(i);
      }
    } else {
      // Complex pagination logic for many pages
      const leftBound = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const rightBound = Math.min(calculatedTotalPages, leftBound + maxVisiblePages - 1);
      
      for (let i = leftBound; i <= rightBound; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
      {/* Tabs header */}
      <div className="flex justify-between items-center border-b">
        <div className="flex gap-4 px-6">
          <button className="py-4 px-2 text-orange-500 border-b-2 border-orange-500 font-medium">
            Liste des retenues
          </button>
          <button className="py-4 px-2 text-gray-500 hover:text-gray-700">
            Liste d'attente
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-orange-500">
              {columns.map((column) => (
                <th
                  key={column.accessorKey}
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-medium text-white first:rounded-tl-lg last:rounded-tr-lg"
                >
                  {column.header}
                </th>
              ))}
              {renderRowActions && (
                <th scope="col" className="relative px-6 py-3 text-right text-sm font-medium text-white">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              // Loading state
              Array.from({ length: itemsPerPage }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-6 py-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </td>
                  ))}
                  {renderRowActions && (
                    <td className="px-6 py-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </td>
                  )}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (renderRowActions ? 1 : 0)}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  Aucune donnée disponible
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  {columns.map((column) => (
                    <td
                      key={column.accessorKey}
                      className="px-6 py-4 text-sm text-gray-900"
                    >
                      {column.cell
                        ? column.cell(row[column.accessorKey], row)
                        : row[column.accessorKey]}
                    </td>
                  ))}
                  {renderRowActions && (
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-500 hover:text-gray-700">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Improved pagination */}
      <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span>Apprenants/page</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange?.(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700">
            {startIndex + 1} à {endIndex} apprenants pour {totalItems}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
              aria-label="Page précédente"
            >
              <ChevronLeft size={20} />
            </button>
            
            {generatePaginationItems().map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => onPageChange?.(pageNum)}
                className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-medium
                  ${currentPage === pageNum
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'}`}
                aria-label={`Page ${pageNum}`}
                aria-current={currentPage === pageNum ? 'page' : undefined}
              >
                {pageNum}
              </button>
            ))}
            
            {calculatedTotalPages > 5 && currentPage < calculatedTotalPages - 2 && (
              <span className="px-1 flex items-center text-gray-500">...</span>
            )}
            
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === calculatedTotalPages}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
              aria-label="Page suivante"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};