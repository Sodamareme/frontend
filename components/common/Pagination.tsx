'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ... paste the entire Pagination component code here ...
interface PaginationProps {
    totalItems: number;
    initialItemsPerPage?: number;
    onPageChange?: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
  }
  
  export default function Pagination({ 
    totalItems, 
    initialItemsPerPage = 1,
    onPageChange,
    onItemsPerPageChange
  }: PaginationProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
    const totalPages = Math.ceil(totalItems / itemsPerPage);
  
    // Reset to page 1 when items per page changes
    useEffect(() => {
      setCurrentPage(1);
    }, [itemsPerPage]);
  
    // Notify parent components of changes
    useEffect(() => {
      if (onPageChange) onPageChange(currentPage);
    }, [currentPage, onPageChange]);
  
    useEffect(() => {
      if (onItemsPerPageChange) onItemsPerPageChange(itemsPerPage);
    }, [itemsPerPage, onItemsPerPageChange]);
  
    const goToPage = (page: number) => {
      if (page < 1 || page > totalPages) return;
      setCurrentPage(page);
    };
  
    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setItemsPerPage(Number(e.target.value));
    };
  
    // Generate page numbers to display
    const getPageNumbers = () => {
      const pageNumbers = [];
      
      // Always show first page
      pageNumbers.push(1);
      
      // Calculate visible pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Add ellipsis after page 1 if needed
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      // Add pages around current page
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Add last page if there is more than one page
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
      
      return pageNumbers;
    };
  
    return (
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center">
          <span className="text-sm text-gray-600">page</span>
          <div className="relative mx-2">
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="appearance-none pl-3 pr-8 py-1 border border-gray-300 bg-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value={1}>1</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
  
        <div className="flex items-center space-x-1">
          <span className="text-sm text-gray-600">
            {currentPage} à {Math.min(totalPages, 5)} pour {totalItems}
          </span>
        </div>
  
        <div className="flex items-center space-x-1">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
            aria-label="Page précédente"
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
                    currentPage === page 
                      ? 'bg-orange-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
  
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
            aria-label="Page suivante"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }