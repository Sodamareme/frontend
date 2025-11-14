'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Referential } from '@/lib/api';

interface SimpleReferentialCardProps {
  referential: Referential;
}

export default function SimpleReferentialCard({ referential }: SimpleReferentialCardProps) {
  return (
    <Link 
      href={`/dashboard/referentials/${referential.id}`}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow max-w-[280px]"
    >
      {/* Image Container */}
      <div className="relative w-full border-8 border-white h-40 bg-white">
        <Image
          src={referential.photoUrl || '/placeholder-referential.png'}
          alt={referential.name}
          fill
          className="object-cover rounded-xl"
        />
      </div>

      {/* Content Container */}
      <div className="p-3">
        {/* Title with teal color */}
        <h3 className="font-medium text-teal-600 text-sm mb-2">
          {referential.name}
        </h3>
        
        {/* Description */}
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          {referential.description || 'Le développeur web mobile crée, écrit, teste et documente des applications mobiles, des sites web...'}
        </p>
        
        {/* Green divider */}
        <div className="h-0.5 w-12 bg-teal-500 mb-2"></div>
        
        {/* Capacity */}
        <p className="text-xs text-gray-600">
          Capacité: {referential.capacity} places
        </p>
      </div>
    </Link>
  );
}