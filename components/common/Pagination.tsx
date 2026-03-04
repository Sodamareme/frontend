'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ... paste the entire Pagination component code here ...
// Pagination.tsx — version contrôlée

interface PaginationProps {
  totalItems: number;
  currentPage: number;           // ✅ Ajouté — contrôlé par le parent
  itemsPerPage: number;          // ✅ Ajouté — contrôlé par le parent
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

export default function Pagination({ 
  totalItems,
  currentPage,       // ✅ Plus de useState interne
  itemsPerPage,      // ✅ Plus de useState interne
  onPageChange,
  onItemsPerPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    onPageChange(page);  // ✅ Délègue au parent directement
  };

  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    pageNumbers.push(1);
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);
    if (startPage > 2) pageNumbers.push('...');
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
    if (endPage < totalPages - 1) pageNumbers.push('...');
    if (totalPages > 1) pageNumbers.push(totalPages);
    return pageNumbers;
  };

  return (
    <div className="flex items-center space-x-1">
      <span className="text-sm text-gray-600 mr-2">
        {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}–{Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems}
      </span>

      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
      >
        <ChevronLeft size={16} />
      </button>

      {getPageNumbers().map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <span className="px-2 py-1 text-gray-600">...</span>
          ) : (
            <button
              onClick={() => goToPage(page as number)}
              className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium ${
                currentPage === page ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages || totalPages === 0}
        className={`p-2 rounded-md ${currentPage === totalPages || totalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}