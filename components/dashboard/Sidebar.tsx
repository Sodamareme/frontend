'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Modal from '../shared/Modal';
import { 
  Home, 
  Users, 
  Book, 
  FileText,
  Folder,
  Laptop,
  BarChart,
  QrCode,
  Coffee,
  Clipboard,
  Component,
  ChefHat,
  UserCheck
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  userRole?: 'ADMIN' | 'COACH' | 'APPRENANT' | 'RESTAURATEUR' | 'VIGIL';
}

export default function DashboardSidebar({ isOpen, setIsOpen, userRole = 'ADMIN' }: SidebarProps) {
  const pathname = usePathname();

  const getNavigationLinks = () => {
    // Common links for all roles with updated icons matching the mockup
    const adminLinks = [
      { href: '/dashboard', label: 'Tableau de bord', icon: <Home size={20} /> },
      { href: '/dashboard/promotions', label: 'Promotions', icon: <Folder size={20} /> },
      { href: '/dashboard/referentials', label: 'Référentiels', icon: <Book size={20} /> },
      { href: '/dashboard/learners', label: 'Apprenants', icon: <Users size={20} /> },
      { href: '/dashboard/coaches', label: 'Coaches', icon: <UserCheck size={20} /> }, // Nouveau lien ajouté
      { href: '/dashboard/attendance', label: 'Gestion des présences', icon: <FileText size={20} /> },
      { href: '/dashboard/kits', label: 'Kits & Laptops', icon: <Laptop size={20} /> },
      { href: '/dashboard/modules', label: 'Modules', icon: <Component size={20} /> },
      { href: '/dashboard/restaurateurs', label: 'Historiques Restaurations', icon: <ChefHat size={20} /> },
      { href: '/dashboard/notes', label: 'Notes', icon: <BarChart size={20} /> },
    ];
    
    // Role-specific links
    const roleLinks = {
      ADMIN: adminLinks,
      COACH: [
        { href: '/dashboard', label: 'Tableau de bord', icon: <Home size={20} /> },
        { href: '/dashboard/learners', label: 'Apprenants', icon: <Users size={20} /> },
        { href: '/dashboard/modules', label: 'Modules', icon: <Book size={20} /> },
        { href: '/dashboard/attendance', label: 'Présence', icon: <FileText size={20} /> },
      ],
      APPRENANT: [
        { href: '/dashboard', label: 'Tableau de bord', icon: <Home size={20} /> },
        { href: '/dashboard/profile', label: 'Mon Profil', icon: <Users size={20} /> },
        { href: '/dashboard/attendance/my', label: 'Ma Présence', icon: <FileText size={20} /> },
      ],
      VIGIL: [
        { href: '/dashboard', label: 'Tableau de bord', icon: <Home size={20} /> },
        { href: '/dashboard/attendance/scan', label: 'Scanner', icon: <QrCode size={20} /> },
        { href: '/dashboard/attendance/history', label: 'Historique', icon: <FileText size={20} /> },
      ],
      RESTAURATEUR: [
        { href: '/dashboard', label: 'Tableau de bord', icon: <Home size={20} /> },
       // href: '/dashboard/meals/scan', label: 'Scanner', icon: <QrCode size={20} /> },
        { href: '/dashboard/meals/history', label: 'Historique', icon: <Coffee size={20} /> },
      ],
    };
    
    return roleLinks[userRole] || adminLinks;
  };

  // Modification ici pour s'assurer qu'un seul lien soit actif
  const isActive = (path: string) => {
    // Exact match uniquement (sans le startsWith)
    return pathname === path;
  };

  const links = getNavigationLinks();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-30 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 shadow-sm transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header with logo */}
          <div className="flex flex-col items-center justify-center py-6 px-4">
            <Link href="/dashboard" className="flex items-center justify-center">
              <img 
                src="https://res.cloudinary.com/drxouwbms/image/upload/v1743507686/image_27_qtiin4.png" 
                alt="Sonatel Academy"
                className="w-auto h-12"
              />
            </Link>
            
            {/* Promotion badge */}
            <div className="mt-4 bg-orange-50 text-[#ff7900] px-6 py-1.5 rounded-full text-xs font-medium">
              Promotion - 2025
            </div>
          </div>
          
          <div className="px-4 mx-2 mb-2">
            <div className="h-px bg-gray-100"></div>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 py-2 px-3 overflow-y-auto">
            <ul className="space-y-1">
              {links.map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`flex items-center px-3 py-2 text-sm rounded-md transition-all ${
                        active
                          ? 'bg-orange-50 text-[#ff7900] font-medium shadow-sm border-l-8 border-[#ff7900]'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className={`flex items-center justify-center w-7 h-7 ${active ? 'text-[#ff7900]' : 'text-gray-400'}`}>
                        {link.icon}
                      </span>
                      <span className="ml-3">{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          {/* Sidebar footer */}
          <div className="p-4 mt-auto">
            <div className="h-px bg-gray-100 mb-4"></div>
          </div>
        </div>
      </div>
    </>
  );
}