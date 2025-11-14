'use client';

import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  change?: string; // e.g. "+5%" or "-3%"
  suffix?: string; // e.g. "jours", "%", etc.
  loading?: boolean;
  bgColor?: string; // Optional background color
}

export default function StatCard({ title, value, icon, change, suffix, loading = false }: StatCardProps) {
  // Determine if change is positive, negative, or neutral
  const isPositive = change && change.startsWith('+');
  const isNegative = change && change.startsWith('-');
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-5"
    style={{
      backgroundImage: "url('https://res.cloudinary.com/drxouwbms/image/upload/v1743765994/patternCard_no3lhf.png')",
      backgroundSize: "cover",
      backgroundPosition: "center"
    }}
    >
      
      {loading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3"
          >
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            {icon && <div>{icon}</div>}
          </div>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-gray-900">
              {value.toLocaleString()}
            </p>
            {suffix && (
              <p className="ml-1 text-sm text-gray-500">
                {suffix}
              </p>
            )}
          </div>
          
          {change && (
            <div className="mt-2">
              <span 
                className={`inline-flex items-center text-xs font-medium ${
                  isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'
                }`}
              >
                {isPositive && <ArrowUp className="h-3 w-3 mr-1" />}
                {isNegative && <ArrowDown className="h-3 w-3 mr-1" />}
                {change}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
} 