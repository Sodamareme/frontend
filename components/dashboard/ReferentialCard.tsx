'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Referential } from '@/lib/api';
import { Users, BookOpen } from 'lucide-react';

interface ReferentialCardProps {
  referential: Referential;
  
}

export default function ReferentialCard({ referential }: ReferentialCardProps) {
  return (
    <Link 
      href={`/dashboard/referentials/${referential.id}`}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow max-w-[280px]"
    >
      {/* Image Container with programming bubbles */}
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
        <h3 className="font-medium text-teal-600 text-sm mb-1">
          {referential.name}
        </h3>
        
        {/* Modules count */}
        <p className="text-gray-800 mb-1 font-medium text-xs">
          {referential.modules?.length || 0} modules
        </p>
        
        {/* Description */}
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          {referential.description || 'Le développeur web mobile crée, écrit, teste et documente des applications mobiles, des sites web...'}
        </p>
        
        {/* Green divider */}
        <div className="h-0.5 w-12 bg-teal-500 mb-2"></div>
        
        {/* Profile images and learners count */}
        <div className="flex items-center">
          {/* Circle avatars */}
          <div className="flex -space-x-1.5 mr-2">
            {/* First learner */}
            {referential.learners && referential.learners[0]?.photoUrl ? (
              <div className="w-5 h-5 rounded-full border-2 border-white overflow-hidden">
                <Image
                  src={referential.learners[0].photoUrl}
                  alt="First learner avatar"
                  width={20}
                  height={20}
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-gray-300 border-2 border-white" />
            )}
            
            {/* Second learner */}
            {referential.learners && referential.learners[1]?.photoUrl ? (
              <div className="w-5 h-5 rounded-full border-2 border-white overflow-hidden">
                <Image
                  src={referential.learners[1].photoUrl}
                  alt="Second learner avatar"
                  width={20}
                  height={20}
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-gray-400 border-2 border-white" />
            )}
            
            {/* Third learner */}
            {referential.learners && referential.learners[2]?.photoUrl ? (
              <div className="w-5 h-5 rounded-full border-2 border-white overflow-hidden">
                <Image
                  src={referential.learners[2].photoUrl}
                  alt="Third learner avatar"
                  width={20}
                  height={20}
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-gray-500 border-2 border-white" />
            )}
          </div>
          
          {/* Learners count */}
          <span className="text-xs text-teal-600 font-medium">
            {referential.learners?.length || 0} apprenants
          </span>
        </div>
      </div>
    </Link>
  );
}