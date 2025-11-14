"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import {
  LayoutGrid,
  BookOpen,
  Users,
  ClipboardCheck,
  Laptop,
  BarChart3,
  LogOut,
  Menu,
  BellRing,
  ChevronDown
} from 'lucide-react';

type DashboardLayoutProps = {
  children: React.ReactNode;
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const navigationItems = [
    {
      label: 'Tableau de bord',
      href: '/dashboard',
      icon: <LayoutGrid className="w-5 h-5" />,
    },
    {
      label: 'Promotions',
      href: '/promotions',
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      label: 'Référentiels',
      href: '/referentiels',
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      label: 'Apprenants',
      href: '/apprenants',
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: 'Gestion des présences',
      href: '/presences',
      icon: <ClipboardCheck className="w-5 h-5" />,
    },
    {
      label: 'Kits & Laptops',
      href: '/kits',
      icon: <Laptop className="w-5 h-5" />,
    },
    {
      label: 'Modules',
      href: '/modules',
      icon: <BarChart3 className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className={`${isSidebarCollapsed ? 'hidden' : 'block'}`}>
              <Image 
                src="/sonatel-logo.svg" 
                alt="Sonatel Logo" 
                width={120} 
                height={40} 
                className="h-10 w-auto"
              />
            </div>
            <Image 
              src="/sonatel-icon.svg" 
              alt="Sonatel Icon" 
              width={32} 
              height={32}
              className={`${isSidebarCollapsed ? 'block' : 'hidden'} h-8 w-auto`}
            />
          </div>
          <button
            onClick={toggleSidebar}
            className="text-gray-500 hover:text-gray-700"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        
        {/* Promotion info */}
        <div className={`py-3 px-4 text-center text-sm text-yellow-500 border-b border-gray-200 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
          Promotion - 2025
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto pt-4">
          <ul className="space-y-1 px-2">
            {navigationItems.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <li key={index}>
                  <Link
                    href={item.href}
                    className={`flex items-center py-3 px-3 rounded-lg ${
                      isActive ? 'bg-yellow-50 text-yellow-800' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span className={`${isSidebarCollapsed ? 'hidden' : 'block'}`}>
                      {item.label}
                    </span>
                    {isActive && <div className={`w-1 absolute left-0 h-8 bg-yellow-500 rounded-r-full ${isSidebarCollapsed ? 'hidden' : 'block'}`}></div>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Logout button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="flex items-center py-2 px-3 text-gray-700 hover:bg-gray-100 rounded-lg w-full"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className={`${isSidebarCollapsed ? 'hidden' : 'block'}`}>
              Se déconnecter
            </span>
          </button>
        </div>
      </aside>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 py-3 px-6 flex justify-between items-center">
          {/* Search */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search"
                className="h-10 w-full border border-gray-300 rounded-md pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
          </div>
          
          {/* User menu */}
          <div className="flex items-center">
            {/* Notifications */}
            <button className="p-2 mr-4 text-gray-400 hover:text-gray-600 relative">
              <BellRing className="h-6 w-6" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
            
            {/* User dropdown */}
            <div className="relative">
              <button className="flex items-center space-x-3 focus:outline-none">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300">
                  <Image 
                    src="/user-avatar.jpg" 
                    alt="User Avatar"
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-700">Awa Niang</p>
                  <p className="text-xs text-gray-500">Admin</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </header>
        
        {/* Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 