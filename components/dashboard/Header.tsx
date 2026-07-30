'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Bell, MenuIcon, Search, User, LogOut, Settings, ChevronDown, X, Mail, Calendar, Trophy, ChevronRight, FileText } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useUserPhoto } from '@/hooks/useUserPhoto';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/shared/Modal';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
// import { useNotifications } from '@/hooks/useNotifications';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
  user?: { email: string; role: string } | null;
}

interface LocalNotification {
  id: number;
  type: 'message' | 'alert' | 'event' | 'award' | 'JUSTIFICATION_REQUEST' | 'JUSTIFICATION_SUBMITTED';
  message: string;
  date: string;
  read: boolean;
  attendance?: {
    learner: {
      firstName: string;
      lastName: string;
    };
  };
  createdAt?: string;
}

export default function Header({ toggleSidebar, user: propUser }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; role: string } | null>(propUser || null);
  const { photoUrl, loading } = useUserPhoto(user?.email);
  // const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  // const { notifications, markAsRead: markNotificationAsRead, handleNotificationClick } = useNotifications();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    if (propUser) {
      setUser(propUser);
      return;
    }
    
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
        }
      }
    }
  }, [propUser]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        // setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getUserRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      'ADMIN': 'Administrateur',
      'COACH': 'Coach',
      'APPRENANT': 'Apprenant',
      'VIGIL': 'Vigil',
      'RESTAURATEUR': 'Restaurateur'
    };
    
    return roleMap[role] || role.toLowerCase();
  };

  // const unreadNotificationsCount = useMemo(() => 
  //   notifications.filter(n => !n.read).length,
  //   [notifications]
  // );

  const markAllAsRead = () => {
    // notifications.forEach(notification => {
    //   if (!notification.read) {
    //     markNotificationAsRead(notification.id.toString());
    //   }
    // });
  };

  const markAsRead = (id: number) => {
    // setNotifications(notifications.map(n => 
    //   n.id === id ? { ...n, read: true } : n
    // ));
  };

  // Use markNotificationAsRead from useNotifications where necessary

  const removeNotification = (id: number) => {
    // setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    setShowProfileMenu(false); // Close profile menu
  };

  const handleLogoutConfirm = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'message':
        return <Mail size={16} className="text-blue-500" />;
      case 'alert':
        return <Bell size={16} className="text-red-500" />;
      case 'event':
        return <Calendar size={16} className="text-green-500" />;
      case 'award':
        return <Trophy size={16} className="text-yellow-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch(type) {
      case 'message':
        return 'border-l-blue-500';
      case 'alert':
        return 'border-l-red-500';
      case 'event':
        return 'border-l-green-500';
      case 'award':
        return 'border-l-yellow-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const toggleSearch = () => {
    setSearchFocused(!searchFocused);
    if (!searchFocused) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  const handleJustificationClick = useCallback((attendance) => {
    if (!attendance) return;
    
    // Update URL with attendance ID as query parameter
    router.push(`/dashboard/attendance?justify=${attendance.id}`);
    
    // Close notifications dropdown if open
    // setShowNotifications(false);
  }, [router]);

  // Filtrer les notifications pour les demandes de justification
  // const justificationRequests = notifications.filter(
  //   n => n.type === 'JUSTIFICATION_REQUEST' && !n.read
  // );

  // Filter justification notifications
  // const justificationNotifications = notifications.filter(
  //   n => n.type === 'JUSTIFICATION_SUBMITTED' && !n.read
  // );

  // Mettre à jour le rendu des notifications
  const renderNotification = (notification) => {
    switch (notification.type) {
      case 'JUSTIFICATION_SUBMITTED':
        return (
          <motion.div 
            key={notification.id}
            className="border-l-4 border-l-orange-500 hover:bg-orange-50"
            onClick={() => handleJustificationClick(notification.attendance)}
          >
            <div className="p-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">{notification.message}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(notification.createdAt), 'PPp', { locale: fr })}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      // ... autres types de notifications
    }
  };

  const renderNotifications = () => {
    // if (!notifications.length) {
    //   return (
    //     <div className="p-8 text-center">
    //       <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
    //         <Bell size={24} className="text-gray-400" />
    //       </div>
    //       <p className="text-gray-500 text-sm">Aucune notification</p>
    //     </div>
    //   );
    // }

    // return notifications.map((notification) => (
    //   <motion.div 
    //     key={notification.id}
    //     className="border-l-4 border-l-orange-500 hover:bg-orange-50 cursor-pointer"
    //     onClick={async () => {
    //       try {
    //         // Mark as read
    //         await markNotificationAsRead(notification.id);
            
    //         // Update URL without navigation
    //         const url = new URL(window.location.href);
    //         url.searchParams.set('justify', notification.attendanceId);
    //         window.history.pushState({}, '', url);

    //         // Close notifications dropdown
    //         setShowNotifications(false);

    //         // Dispatch a custom event to notify the page
    //         window.dispatchEvent(new CustomEvent('justificationRequest', {
    //           detail: { attendanceId: notification.attendanceId }
    //         }));
    //       } catch (error) {
    //         console.error('Error handling notification:', error);
    //         toast.error('Une erreur est survenue');
    //       }
    //     }}
    //   >
    //     <div className="p-4">
    //       <div className="flex items-start space-x-3">
    //         <div className="p-2 bg-orange-100 rounded-lg">
    //           <FileText className="h-4 w-4 text-orange-500" />
    //         </div>
    //         <div>
    //           <p className="text-sm font-medium">
    //             {notification.message}
    //           </p>
    //           <p className="text-xs text-gray-500">
    //             {format(new Date(notification.createdAt), 'PPp', { locale: fr })}
    //           </p>
    //         </div>
    //       </div>
    //     </div>
    //   </motion.div>
    // ));
  };

  return (
    <>
      <header className="bg-white border-b">
        <div className="flex items-center justify-between h-16 px-4 relative">
          {/* Left: Menu button and search */}
          <div className="flex items-center space-x-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleSidebar}
              className="text-gray-600 hover:text-gray-900 lg:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-all"
            >
              <MenuIcon size={24} />
            </motion.button>
            
            <motion.div 
              initial={false}
              animate={{
                width: searchFocused ? '300px' : '220px',
                backgroundColor: searchFocused ? '#f9f9f9' : '#f3f4f6',
                boxShadow: searchFocused ? '0 4px 12px rgba(0,0,0,0.08)' : 'none'
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-full"
            >
              <Search 
                size={20} 
                className={`${searchFocused ? 'text-orange-500' : 'text-gray-500'} transition-colors duration-300`} 
                onClick={toggleSearch}
              />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Rechercher..." 
                className="bg-transparent border-none focus:outline-none text-sm w-full transition-all"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </motion.div>
          </div>
          
          {/* Right: Notifications and profile */}
          <div className="flex items-center space-x-4">
            {/* Notifications button */}
            <div className="relative" ref={notificationsRef}>
              {/* <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 text-gray-600 hover:text-orange-500 bg-gray-100 rounded-full transition-colors duration-300"
                // onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                <AnimatePresence>
                  {/* {unreadNotificationsCount > 0 && ( */}
                    {/* <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      className="absolute top-0 right-0 h-5 w-5 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
                    > */}
                      {/* {unreadNotificationsCount} */}
                    {/* </motion.span> */}
                  {/* )} */}
                {/* </AnimatePresence> */}
              {/* </motion.button> */}
              
              {/* Notifications dropdown */}
              <AnimatePresence>
                {/* {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
                    style={{ transformOrigin: 'top right' }}
                  >
                    <div className="flex items-center justify-between p-5 border-b">
                      <h3 className="font-semibold text-gray-800 text-lg flex items-center">
                        <Bell size={18} className="mr-2 text-orange-500" />
                        Notifications
                      </h3>
                      <div className="flex space-x-2">
                        {unreadNotificationsCount > 0 && (
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={markAllAsRead}
                            className="text-xs text-orange-500 hover:text-orange-600 font-medium bg-orange-50 hover:bg-orange-100 px-3 py-1 rounded-full transition-colors duration-200"
                          >
                            Tout marquer comme lu
                          </motion.button>
                        )}
                      </div>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {renderNotifications()}
                    </div>
                    
                    <div className="p-4 border-t bg-gray-50">
                      <Link href="/all-notifications" className="text-sm text-center block text-orange-500 hover:text-orange-600 font-medium">
                        Voir toutes les notifications
                      </Link>
                    </div>
                  </motion.div>
                )} */}
              </AnimatePresence>
            </div>
            
            {/* Profile menu */}
            <div className="relative" ref={profileMenuRef}>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-3 p-2 rounded-full hover:bg-gray-100 transition-all duration-300"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <motion.div 
                  className="relative w-8 h-8 rounded-full overflow-hidden"
                  whileHover={{ boxShadow: '0 0 0 2px rgba(249, 115, 22, 0.4)' }}
                  transition={{ duration: 0.2 }}
                >
                  {loading ? (
                    <div className="w-full h-full bg-gray-200 animate-pulse" />
                  ) : photoUrl ? (
                    <Image
                      src={photoUrl}
                      alt="Profile"
                      fill
                      className="object-cover"
                      sizes="32px"
                      priority
                    />
                  ) : (
                    <div className="w-full h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white shadow-inner">
                      {user?.email ? user.email.charAt(0).toUpperCase() : <User size={18} />}
                    </div>
                  )}
                  <motion.div 
                    className="absolute inset-0 bg-black opacity-0 rounded-full"
                    whileHover={{ opacity: 0.1 }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-700">
                    {user?.email ? user.email.split('@')[0] : 'Utilisateur'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.role ? getUserRoleDisplay(user.role) : 'Aucun rôle'}
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: showProfileMenu ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown size={16} className="text-gray-500 hidden md:block" />
                </motion.div>
              </motion.button>
              
              {/* Profile dropdown menu */}
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
                    style={{ transformOrigin: 'top right' }}
                  >
                    <div className="p-6 border-b bg-gradient-to-r from-orange-50 to-white">
                      <div className="flex items-center space-x-4">
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-orange-500 ring-offset-2"
                        >
                          {loading ? (
                            <div className="w-full h-full bg-gray-200 animate-pulse" />
                          ) : photoUrl ? (
                            <Image
                              src={photoUrl}
                              alt="Profile"
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white shadow-inner">
                              {user?.email ? user.email.charAt(0).toUpperCase() : <User size={24} />}
                            </div>
                          )}
                        </motion.div>
                        <div>
                          <div className="font-semibold text-gray-800">
                            {user?.email ? user.email.split('@')[0] : 'Utilisateur'}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            {user?.role ? getUserRoleDisplay(user.role) : 'Aucun rôle'}
                          </div>
                        </div>
                      </div>
                    </div>  
                    
                   
<div className="py-2">
  {[
    // { href: "/profile", icon: <User size={16} />, text: "Mon profil" },
    { href: "/dashboard/settings/change-password", icon: <Lock size={16} />, text: "Changer le mot de passe" },
    // { href: "/settings", icon: <Settings size={16} />, text: "Paramètres" }
  ].map((item, index) => (
                        <motion.div
                          key={item.href}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Link 
                            href={item.href} 
                            className="flex items-center justify-between px-6 py-3 text-sm text-gray-700 hover:bg-orange-50 transition-colors duration-200"
                          >
                            <div className="flex items-center">
                              <div className="mr-3 text-orange-500">
                                {item.icon}
                              </div>
                              {item.text}
                            </div>
                            <ChevronRight size={14} className="text-gray-400" />
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                    
                    <div className="py-2 border-t">
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <button 
                          onClick={handleLogoutClick}
                          className="flex w-full items-center justify-between px-6 py-3 text-sm text-gray-700 hover:bg-red-50 transition-colors duration-200"
                        >
                          <div className="flex items-center">
                            <div className="mr-3 text-red-500">
                              <LogOut size={16} />
                            </div>
                            Déconnexion
                          </div>
                        </button>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Add Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
      >
        <div className="text-center p-1">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-medium text-gray-900">
              Confirmer la déconnexion
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                Êtes-vous sûr de vouloir vous déconnecter ?
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-center space-x-3">
            <button
              type="button"
              className="inline-flex justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setShowLogoutModal(false)}
            >
              Annuler
            </button>
            <button
              type="button"
              className="inline-flex justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              onClick={handleLogoutConfirm}
            >
              Déconnexion
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}