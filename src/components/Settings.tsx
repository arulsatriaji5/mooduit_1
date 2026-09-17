import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { 
  User, 
  Bell, 
  Moon, 
  Sun,
  Languages, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  ChevronDown,
  Shield,
  ArrowLeft,
  Camera,
  Eye,
  EyeOff,
  Lock,
  BookOpen,
  X
} from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { isUserBirthdayToday } from './BirthdayModal';
import './Settings.css';

interface SettingsProps {
  onLogout?: () => void;
}

export default function Settings({ onLogout }: SettingsProps) {
  const { theme, toggleTheme, language, setLanguage, t } = useThemeLanguage();
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const darkMode = theme === 'dark';

  const [currentAvatar, setCurrentAvatar] = useState(() => {
    const email = localStorage.getItem('userEmail');
    const savedLocalAvatar = email ? localStorage.getItem(`avatar_${email}`) : null;
    return localStorage.getItem('userAvatar') || savedLocalAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arul';
  });
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  // VIEW NAVIGATION STATE
  const [activeView, setActiveView] = useState<'main' | 'profile'>('main');

  // USER PROFILE FIELDS
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('userName') || 'Arul Satriaji';
  });
  const [userEmail] = useState(() => {
    return localStorage.getItem('userEmail') || 'arulsatriaji5@gmail.com';
  });
  const [userDob, setUserDob] = useState(() => {
    return localStorage.getItem('userDob') || '';
  });
  const [userId] = useState(() => {
    return localStorage.getItem('userId') || '';
  });
  const [authProvider] = useState(() => {
    return localStorage.getItem('authProvider') || 'local';
  });
  const isGoogleUser = authProvider === 'google' || localStorage.getItem('authProvider') === 'google';

  React.useEffect(() => {
    if (userEmail) {
      fetch(`/api/users/profile?email=${encodeURIComponent(userEmail)}`, { credentials: 'include' })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            if (data.dob) {
              setUserDob(data.dob);
              localStorage.setItem('userDob', data.dob);
            }
            if (data.name && data.name !== userName) {
              setUserName(data.name);
              localStorage.setItem('userName', data.name);
            }
          }
        })
        .catch(err => console.warn("Failed to fetch user profile:", err));
    }
  }, [userEmail]);

  // CHANGE PASSWORD FIELDS
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // AVATAR FILE REF
  const fileInputRef = useRef<HTMLInputElement>(null);

  const safeStorageSet = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`localStorage quota exceeded or failed setting key '${key}':`, e);
    }
  };

  const compressImage = (file: File, maxWidth = 256, maxHeight = 256, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const syncProfileAndSession = async (newAvatar: string, newName: string, newDob?: string) => {
    safeStorageSet('userAvatar', newAvatar);
    if (userEmail) {
      safeStorageSet(`avatar_${userEmail}`, newAvatar);
    }
    safeStorageSet('userName', newName);
    const dobToSave = newDob !== undefined ? newDob : userDob;
    if (dobToSave) {
      safeStorageSet('userDob', dobToSave);
    }

    try {
      const savedUserStr = localStorage.getItem('mooduit_user');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        u.picture = newAvatar;
        u.avatar = newAvatar;
        u.name = newName;
        u.dob = dobToSave;
        safeStorageSet('mooduit_user', JSON.stringify(u));
      }
      const savedSessionStr = localStorage.getItem('mooduit_session');
      if (savedSessionStr) {
        const s = JSON.parse(savedSessionStr);
        if (s.user) {
          s.user.picture = newAvatar;
          s.user.avatar = newAvatar;
          s.user.name = newName;
          s.user.dob = dobToSave;
          safeStorageSet('mooduit_session', JSON.stringify(s));
        }
      }
    } catch (e) {
      console.error('Error updating local session data:', e);
    }

    window.dispatchEvent(new Event('avatarChanged'));
    window.dispatchEvent(new CustomEvent('profileUpdated', {
      detail: { name: newName, picture: newAvatar, dob: dobToSave }
    }));

    if (userEmail) {
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, name: newName, picture: newAvatar, dob: dobToSave })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
      return data;
    }

    return null;
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedDataUrl = await compressImage(file, 256, 256, 0.85);
        if (compressedDataUrl) {
          setCurrentAvatar(compressedDataUrl);
          await syncProfileAndSession(compressedDataUrl, userName);
        }
      } catch (err) {
        console.error('Error compressing image:', err);
      }
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const avatarOptions = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Arul',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Tinkerbell',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Snuggles'
  ];

  return (
    <div className="w-full max-w-full px-4 mx-auto box-border min-h-screen overflow-x-hidden flex flex-col items-center pb-32 md:pb-12 !bg-transparent dark:bg-slate-900">
      
      {/* CONTAINER KONTEN - BEBAS DARI WARNA ABU-ABU */}
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto flex flex-col gap-5 pt-6 md:pt-10 !bg-transparent box-border">
        
        <AnimatePresence mode="wait">
          {activeView === 'main' ? (
            <motion.div
              key="main-settings"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="w-full flex flex-col gap-5 !bg-transparent"
            >
              {/* Judul Halaman */}
              <h1 className="text-2xl sm:text-3xl font-bold text-[#112F58] dark:text-white mb-2 md:mb-4 text-left w-full">
                {t("Pengaturan", "Settings")}
              </h1>

              {/* BUNGKUSAN SEMUA KARTU PENGATURAN */}
              <div className="w-full flex flex-col gap-4">
                <div 
                  onClick={() => setActiveView('profile')}
                  className="w-full card-mooduit overflow-hidden mb-4 p-0 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all duration-200"
                >
                  <div className="p-4 d-flex align-items-center justify-content-between bg-light bg-opacity-50 min-w-0 w-full overflow-hidden">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                      {/* Kunci Bulat Sempurna (Anti-Melar) */}
                      <div style={{ width: '60px', height: '60px', flexShrink: 0, borderRadius: '50%', overflow: 'hidden', border: '2px solid #e2e8f0' }}>
                        <img 
                          src={currentAvatar} 
                          alt="Profile" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#ffffff' }} 
                        />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden" style={{ minWidth: 0, overflow: 'hidden' }}>
                        <h2 
                          className="truncate text-base sm:text-lg font-bold text-[#112F58] dark:text-white mb-0.5"
                        >
                          {userName}
                        </h2>
                        <p 
                          className="truncate text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-0 font-medium"
                        >
                          {userEmail}
                        </p>
                      </div>
                    </div>
                    <button className="btn btn-light btn-sm rounded-circle p-2 flex-shrink-0"><ChevronRight size={18} /></button>
                  </div>
                </div>

                <h2 className="font-bold text-slate-500 dark:text-slate-400 text-xs sm:text-sm uppercase tracking-wider mb-3 px-2">{t("Aplikasi", "Application")}</h2>
                
                {/* Container Mode Gelap Berbentuk Kapsul/Pil Halus Standalone */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  marginBottom: '1rem',
                  width: '100%',
                  backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                  borderRadius: '1rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                  border: theme === 'dark' ? '1px solid #334155' : '1px solid #f1f5f9',
                  overflow: 'hidden',
                  boxSizing: 'border-box'
                }}>
                  
                  {/* Bagian Kiri: Ikon dan Teks Dipaksa Muncul */}
                  <div className="flex-grow-1 min-w-0" style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0, overflow: 'hidden' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '9999px',
                      backgroundColor: theme === 'dark' ? '#334155' : '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: theme === 'dark' ? '#cbd5e1' : '#64748b',
                      flexShrink: 0
                    }}>
                      <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                    </div>
                    
                    {/* INLINE STYLE MUTLAK UNTUK TEKS */}
                    <span className="truncate text-sm sm:text-base font-bold text-[#112F58] dark:text-white">
                      {t("Mode Gelap", "Dark Mode")}
                    </span>
                  </div>

                  {/* Bagian Kanan: Toggle Kapsul Elegan */}
                  <button 
                    onClick={toggleTheme}
                    className="flex-shrink-0"
                    style={{
                      position: 'relative',
                      width: '3.5rem',
                      height: '1.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: theme === 'dark' ? '#112F58' : '#e2e8f0',
                      borderRadius: '9999px',
                      padding: '0.25rem',
                      transition: 'background-color 0.3s',
                      border: 'none',
                      cursor: 'pointer',
                      outline: 'none',
                      flexShrink: 0
                    }}
                  >
                    <div style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      backgroundColor: '#ffffff',
                      borderRadius: '9999px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      transform: theme === 'dark' ? 'translateX(1.75rem)' : 'translateX(0)',
                      transition: 'transform 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {theme === 'dark' ? (
                        <svg style={{ width: '0.75rem', height: '0.75rem', color: '#112F58' }} fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
                      ) : (
                        <svg style={{ width: '0.75rem', height: '0.75rem', color: '#f97316' }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"></path></svg>
                      )}
                    </div>
                  </button>
                </div>

                <div className="w-full card-mooduit mb-4 p-0 box-border relative overflow-visible">
                  <div className="list-group list-group-flush border-0">
                    <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0 border-bottom w-full flex-nowrap relative overflow-visible" style={{ minWidth: 0 }}>
                      <div className="d-flex align-items-center gap-3 flex-grow-1 min-w-0 overflow-hidden" style={{ minWidth: 0 }}>
                        <div className="p-2 bg-light rounded-lg flex-shrink-0"><Languages size={20} /></div>
                        <span className="font-semibold text-sm sm:text-base truncate text-slate-800 dark:text-slate-100" style={{ minWidth: 0 }}>{t("Bahasa", "Language")}</span>
                      </div>
                      
                      {/* CUSTOM DROPDOWN LANGUAGE */}
                      <div className="relative flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsLangOpen(!isLangOpen)}
                          className="flex items-center justify-end gap-2 bg-transparent border-0 !text-[#112F58] dark:!text-slate-100 font-extrabold cursor-pointer p-0 m-0 outline-none shadow-none text-xs sm:text-sm"
                          id="language_dropdown_button"
                        >
                          <span>{language === 'id' ? t("Bahasa Indonesia", "Indonesian") : t("Bahasa Inggris", "English")}</span>
                          <ChevronDown size={16} className={`transition-transform duration-200 ${isLangOpen ? 'rotate-180 text-[#112F58] dark:text-slate-100' : 'text-slate-400 dark:text-slate-300'}`} />
                        </button>

                        {isLangOpen && (
                          <>
                            {/* Backdrop to catch clicks outside */}
                            <div 
                              className="fixed inset-0 z-40 bg-transparent" 
                              onClick={() => setIsLangOpen(false)}
                            />
                            {/* Curved Pop-up Menu */}
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 rounded-2xl shadow-xl overflow-hidden z-50">
                              <button
                                type="button"
                                onClick={() => {
                                  setLanguage('id');
                                  setIsLangOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 text-sm font-bold !text-[#112F58] dark:!text-slate-100 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-600 last:border-0 ${
                                  language === 'id' ? 'bg-slate-100 dark:bg-slate-700' : 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700'
                                }`}
                              >
                                {t("Bahasa Indonesia", "Indonesian")}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setLanguage('en');
                                  setIsLangOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 text-sm font-bold !text-[#112F58] dark:!text-slate-100 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-600 last:border-0 ${
                                  language === 'en' ? 'bg-slate-100 dark:bg-slate-700' : 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700'
                                }`}
                              >
                                {t("Bahasa Inggris", "English")}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsGuideModalOpen(true)}
                      className="privacy-btn d-flex align-items-center justify-content-between p-3 border-0 w-full overflow-hidden flex-nowrap"
                      type="button"
                      style={{ minWidth: 0 }}
                    >
                      <div className="privacy-left d-flex align-items-center gap-3 flex-grow-1 min-w-0 overflow-hidden" style={{ minWidth: 0 }}>
                        <div className="privacy-icon-wrapper flex-shrink-0"><BookOpen size={20} /></div>
                        <div className="text-left min-w-0 flex-1">
                          <span className="privacy-text truncate font-bold text-slate-800 dark:text-slate-100 block text-sm sm:text-base" style={{ margin: 0 }}>
                            {t("Panduan Aplikasi", "App Guide")}
                          </span>
                          <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                            {t("Fitur, cara penggunaan & tips keuangan", "Features, usage guide & money tips")}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="privacy-chevron flex-shrink-0" />
                    </button>
                  </div>
                </div>

                <h2 className="font-bold text-slate-500 dark:text-slate-400 text-xs sm:text-sm uppercase tracking-wider mb-3 px-2">{t("Keamanan", "Security")}</h2>
                <div className="w-full card-mooduit overflow-hidden mb-4 p-0 box-border">
                  <div className="list-group list-group-flush border-0">
                    {/* Keamanan Akun */}
                    <button 
                      onClick={() => {
                        setIsSecurityModalOpen(true);
                        setIsEditingPassword(false);
                        setOldPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="privacy-btn d-flex align-items-center justify-content-between p-3 border-0 border-bottom w-full overflow-hidden flex-nowrap"
                      type="button"
                      style={{ minWidth: 0 }}
                    >
                      <div className="privacy-left d-flex align-items-center gap-3 flex-grow-1 min-w-0 overflow-hidden" style={{ minWidth: 0 }}>
                        <div className="privacy-icon-wrapper flex-shrink-0"><Lock size={20} /></div>
                        <div className="text-left min-w-0 flex-1">
                          <span className="privacy-text truncate font-bold text-slate-800 dark:text-slate-100 block text-sm sm:text-base" style={{ margin: 0 }}>
                            {t("Keamanan Akun", "Account Security")}
                          </span>
                          <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                            {t("Kata sandi, email, dan proteksi akun", "Password, email, and account protection")}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="privacy-chevron flex-shrink-0" />
                    </button>

                    {/* Privasi & Keamanan */}
                    <button 
                      onClick={() => setIsPrivacyModalOpen(true)}
                      className="privacy-btn d-flex align-items-center justify-content-between p-3 border-0 w-full overflow-hidden flex-nowrap"
                      type="button"
                      style={{ minWidth: 0 }}
                    >
                      <div className="privacy-left d-flex align-items-center gap-3 flex-grow-1 min-w-0 overflow-hidden" style={{ minWidth: 0 }}>
                        <div className="privacy-icon-wrapper flex-shrink-0"><Shield size={20} /></div>
                        <div className="text-left min-w-0 flex-1">
                          <span className="privacy-text truncate font-bold text-slate-800 dark:text-slate-100 block text-sm sm:text-base" style={{ margin: 0 }}>
                            {t("Privasi & Keamanan", "Privacy & Security")}
                          </span>
                          <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                            {t("Aturan & enkripsi perlindungan data", "Data protection rules & encryption")}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="privacy-chevron flex-shrink-0" />
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleLogout}
                  className="w-full mooduit-logout-btn text-sm sm:text-base"
                >
                  <LogOut size={20} />
                  {t("Keluar Akun", "Logout")}
                </button>

                <div className="text-center mt-4">
                  <p className="text-muted text-xs sm:text-sm mb-0">MOODUIT v1.0.0 Alpha</p>
                  <p className="text-muted text-xs sm:text-sm">{t("Dibuat dengan ❤️ untuk Gen Z", "Made with ❤️ for Gen Z")}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="profile-settings"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="w-full flex flex-col gap-5 !bg-transparent"
            >
              {/* BACK HEADER */}
              <div className="mooduit-profile-header">
                <button 
                  onClick={() => setActiveView('main')}
                  className="mooduit-profile-back-btn"
                  title="Kembali ke Pengaturan"
                >
                  <ArrowLeft size={20} />
                  <span>{t("Kembali", "Back")}</span>
                </button>
                <h2 className="mooduit-profile-title">{t("Profil Akun", "Account Profile")}</h2>
              </div>

              {/* CHANGE AVATAR AREA */}
              <div className="mooduit-profile-avatar-section">
                <div 
                  className="mooduit-profile-avatar-container"
                  onClick={handleAvatarClick}
                >
                  <img 
                    src={currentAvatar} 
                    alt="Current Profile Avatar" 
                    className="mooduit-profile-avatar-img"
                  />
                  <div className="mooduit-profile-avatar-overlay">
                    <Camera size={24} className="text-white" />
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                <p className="mooduit-profile-avatar-tip text-xs sm:text-sm">
                  {t("Klik untuk mengubah foto profil", "Click to change profile picture")}
                </p>
              </div>

              {/* PERSONAL INFO FORM */}
              <div className="w-full card-mooduit p-4 md:p-5 flex flex-col gap-4">
                <h3 className="mooduit-section-subtitle text-lg sm:text-xl font-bold">{t("Data Diri", "Personal Info")}</h3>
                
                <div className="mooduit-form-group">
                  <label className="mooduit-form-label text-sm sm:text-base font-semibold">{t("Nama Lengkap", "Full Name")}</label>
                  <input 
                    type="text" 
                    value={userName} 
                    onChange={(e) => setUserName(e.target.value)}
                    className="mooduit-form-input text-sm sm:text-base"
                    placeholder={t("Masukkan nama lengkap", "Enter full name")}
                  />
                </div>

                <div className="mooduit-form-group">
                  <label className="mooduit-form-label text-sm sm:text-base font-semibold">{t("Email", "Email Address")}</label>
                  <input 
                    type="email" 
                    value={userEmail} 
                    disabled 
                    readOnly
                    className="mooduit-form-input readonly-input text-sm sm:text-base"
                  />
                  <span className="mooduit-form-tip text-xs sm:text-sm">{t("Email tidak dapat diubah", "Email address cannot be changed")}</span>
                </div>

                <div className="mooduit-form-group">
                  <label className="mooduit-form-label text-sm sm:text-base font-semibold">{t("Tanggal Lahir 🎂", "Date of Birth 🎂")}</label>
                  <input 
                    type="date" 
                    value={userDob} 
                    onChange={(e) => setUserDob(e.target.value)}
                    className="mooduit-form-input text-sm sm:text-base"
                  />
                  <span className="mooduit-form-tip text-xs sm:text-sm">{t("Diperlukan untuk kado & kejutan ulang tahun kamu! 🎉", "Needed for your birthday surprise! 🎉")}</span>
                </div>
              </div>

              {/* SAVE BUTTON */}
              <button 
                onClick={async () => {
                  try {
                    const result = await syncProfileAndSession(currentAvatar, userName, userDob);
                    const birthdayEmail = result?.birthdayEmail;

                    if (birthdayEmail?.sent) {
                      toast.success(language === 'id'
                        ? 'Profil diperbarui dan email ulang tahun sudah dikirim! 🎂'
                        : 'Profile updated and the birthday email was sent! 🎂');
                    } else if (birthdayEmail?.alreadySent) {
                      toast.success(language === 'id'
                        ? 'Profil diperbarui. Email ulang tahun tahun ini sudah pernah dikirim. 🎉'
                        : 'Profile updated. This year\'s birthday email was already sent. 🎉');
                    } else if (isUserBirthdayToday(userDob) && birthdayEmail?.demo) {
                      toast.error(language === 'id'
                        ? 'Profil tersimpan, tetapi email belum terkirim karena SMTP Vercel belum dikonfigurasi.'
                        : 'Profile saved, but the email was not sent because Vercel SMTP is not configured.');
                    } else if (isUserBirthdayToday(userDob) && birthdayEmail?.failed) {
                      toast.error(language === 'id'
                        ? 'Profil tersimpan, tetapi layanan email sedang gagal. Email akan dicoba lagi oleh jadwal otomatis.'
                        : 'Profile saved, but the email service failed. The scheduled job will try again.');
                    } else {
                      toast.success(language === 'id' ? 'Profil berhasil diperbarui! 🎉' : 'Profile successfully updated! 🎉');
                    }
                    setActiveView('main');
                  } catch (error: any) {
                    console.error('Failed to save profile:', error);
                    toast.error(error?.message || (language === 'id' ? 'Profil gagal diperbarui.' : 'Failed to update profile.'));
                  }
                }}
                className="w-full mooduit-save-profile-btn text-sm sm:text-base"
              >
                {t("Simpan Perubahan", "Save Changes")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Pop-up Modal Pilih Avatar */}
      <AnimatePresence>
        {isAvatarModalOpen && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 2000 }}>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="position-absolute top-0 start-0 w-100 h-100 bg-black bg-opacity-50 backdrop-blur-sm"
              onClick={() => setIsAvatarModalOpen(false)}
            />
            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl position-relative overflow-hidden w-[90%] max-w-[420px]"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h3 className="font-bold text-[#112F58] dark:text-white mb-1 text-lg sm:text-xl">
                    {t("Pilih Avatar Kamu", "Choose Your Avatar")}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 m-0 mt-1">
                    {t("Pilih salah satu karakter lucu di bawah ini!", "Select one of the cute characters below!")}
                  </p>
                </div>
                <button 
                  onClick={() => setIsAvatarModalOpen(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  className="dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Grid Pilihan Avatar */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {avatarOptions.map((avatar, idx) => {
                  const isSelected = currentAvatar === avatar;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentAvatar(avatar);
                        syncProfileAndSession(avatar, userName);
                      }}
                      className={`relative flex items-center justify-center p-2 rounded-2xl transition-all duration-200 border-2 bg-slate-50 dark:bg-slate-700/50 hover:scale-105 active:scale-95 ${
                        isSelected 
                          ? 'border-[#112F58] dark:border-white ring-4 ring-slate-200 dark:ring-slate-700' 
                          : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                      style={{ outline: 'none' }}
                    >
                      <img 
                        src={avatar} 
                        alt={`Avatar ${idx + 1}`} 
                        className="w-16 h-16 object-cover bg-white rounded-full p-1 shadow-sm"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-[#112F58] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => setIsAvatarModalOpen(false)}
                className="w-full text-white font-bold py-3 rounded-full transition-all text-sm sm:text-base shadow-md"
                style={{ backgroundColor: '#112F58', border: 'none' }}
              >
                {t("Simpan", "Save")}
              </button>
            </motion.div>
          </div>
        )}

        {isPrivacyModalOpen && (
          <div className="security-modal-overlay">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="security-modal-backdrop"
              onClick={() => setIsPrivacyModalOpen(false)}
            />
            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
              className="security-modal-content"
            >
              {/* Header */}
              <div className="security-modal-header">
                <h3 className="security-modal-title text-lg sm:text-xl font-bold">
                  {t("Kebijakan Privasi & Keamanan", "Privacy & Security Policy")}
                </h3>
                <button 
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="security-modal-close"
                  type="button"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="security-modal-body">
                <div className="security-badge text-xs sm:text-sm">
                  <Shield size={16} />
                  <span>AES-256 Secured</span>
                </div>

                <div className="security-section">
                  <h4 className="security-section-title text-base sm:text-lg font-bold">
                    🛡️ {t("Enkripsi Standar Militer", "Military-Grade Encryption")}
                  </h4>
                  <p className="security-section-text text-sm sm:text-base leading-relaxed">
                    {t(
                      "MOODUIT melindungi seluruh data sensitif kamu menggunakan teknologi enkripsi AES-256 bit tingkat lanjut. Proses enkripsi dilakukan secara end-to-end, memastikan informasi keuangan, catatan, dan transaksi harian tidak dapat diakses oleh pihak luar.",
                      "MOODUIT secures all your sensitive data using advanced AES-256 bit encryption. The encryption process is executed end-to-end, ensuring that your financial information, journals, and daily transactions remain completely inaccessible to external parties."
                    )}
                  </p>
                </div>

                <div className="security-section">
                  <h4 className="security-section-title text-base sm:text-lg font-bold">
                    ☁️ {t("Penyimpanan Cloud & Firestore Aman", "Secure Cloud & Firestore Storage")}
                  </h4>
                  <p className="security-section-text text-sm sm:text-base leading-relaxed">
                    {t(
                      "Infrastruktur backend kami berbasis Google Cloud Platform & Firebase Firestore dengan aturan keamanan (Security Rules) yang diperketat secara berlapis. Akses data diautentikasi dengan token aman dan didelegasikan secara ketat berdasarkan kepemilikan akun pengguna.",
                      "Our backend infrastructure runs on Google Cloud Platform & Firebase Firestore, fortified by multi-layered Security Rules. Data access is authenticated via secure tokens and strictly delegated based on user account ownership."
                    )}
                  </p>
                </div>

                <div className="security-section">
                  <h4 className="security-section-title text-base sm:text-lg font-bold">
                    🔒 {t("Jaminan Privasi Data 100%", "100% Data Privacy Guarantee")}
                  </h4>
                  <p className="security-section-text text-sm sm:text-base leading-relaxed">
                    {t(
                      "Privasi kamu adalah prioritas mutlak bagi kami. Kami tidak pernah menjual, menyewakan, atau membagikan aktivitas finansial, catatan suasana hati, maupun informasi demografi kamu kepada platform iklan pihak ketiga atau perantara data.",
                      "Your privacy is our absolute priority. We never sell, rent, or share your financial logs, mood tracking records, or demographic information with third-party advertising networks or data brokers."
                    )}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="security-modal-footer">
                <button 
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="security-modal-btn text-sm sm:text-base font-bold"
                  type="button"
                >
                  {t("Mengerti", "I Understand")}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isSecurityModalOpen && (
          <div className="security-modal-overlay">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="security-modal-backdrop"
              onClick={() => {
                if (!isEditingPassword) {
                  setIsSecurityModalOpen(false);
                }
              }}
            />
            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
              className="security-modal-content"
            >
              {/* Header */}
              <div className="security-modal-header">
                <h3 className="security-modal-title text-lg sm:text-xl font-bold">
                  {t("Keamanan Akun", "Account Security")}
                </h3>
                <button 
                  onClick={() => setIsSecurityModalOpen(false)}
                  className="security-modal-close"
                  type="button"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="security-modal-body">
                {!isEditingPassword ? (
                  /* TAHAP 1 */
                  <div className="flex flex-col gap-4 animate-fade-in text-left">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 text-left">
                        {t("Email Terdaftar", "Registered Email")}
                      </label>
                      <div className="security-email-display p-3.5 border rounded-2xl flex items-center gap-3">
                        <span className="text-xl flex-shrink-0">📧</span>
                        <div className="text-left font-semibold text-sm sm:text-base break-all">
                          {userEmail}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 text-left">
                      <button
                        onClick={() => setIsEditingPassword(true)}
                        className="w-full py-3.5 bg-[#001F3F] hover:bg-[#00172E] text-white font-bold text-sm sm:text-base rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border-0"
                      >
                        🔑 {t("Ubah Kata Sandi", "Change Password")}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* TAHAP 2 */
                  <div className="flex flex-col gap-3 text-left">
                    <h4 className="text-base sm:text-lg font-bold text-[#112F58] dark:text-white mb-1 flex items-center gap-2">
                      🔐 {t("Ubah Kata Sandi Baru", "Set New Password")}
                    </h4>

                    {/* Password Lama */}
                    {!isGoogleUser && (
                      <div className="mooduit-form-group">
                        <label className="mooduit-form-label text-left text-sm sm:text-base font-semibold">{t("Kata Sandi Lama", "Old Password")}</label>
                        <div className="relative w-full">
                          <input 
                            type={showOld ? "text" : "password"} 
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-medium placeholder:text-gray-500 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#001F3F] focus:border-transparent transition-all text-sm sm:text-base"
                            placeholder={t("Masukkan kata sandi lama", "Enter old password")}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowOld(!showOld)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer flex items-center justify-center border-0 bg-transparent"
                          >
                            {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Password Baru */}
                    <div className="mooduit-form-group">
                      <label className="mooduit-form-label text-left text-sm sm:text-base font-semibold">{t("Kata Sandi Baru", "New Password")}</label>
                      <div className="relative w-full">
                        <input 
                          type={showNew ? "text" : "password"} 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-medium placeholder:text-gray-500 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#001F3F] focus:border-transparent transition-all text-sm sm:text-base"
                          placeholder={t("Masukkan kata sandi baru", "Enter new password")}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowNew(!showNew)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer flex items-center justify-center border-0 bg-transparent"
                        >
                          {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Konfirmasi Password */}
                    <div className="mooduit-form-group">
                      <label className="mooduit-form-label text-left text-sm sm:text-base font-semibold">{t("Konfirmasi Kata Sandi Baru", "Confirm New Password")}</label>
                      <div className="relative w-full">
                        <input 
                          type={showConfirm ? "text" : "password"} 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-medium placeholder:text-gray-500 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#001F3F] focus:border-transparent transition-all text-sm sm:text-base"
                          placeholder={t("Ulangi kata sandi baru", "Repeat new password")}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer flex items-center justify-center border-0 bg-transparent"
                        >
                          {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="security-modal-footer">
                {!isEditingPassword ? (
                  <button 
                    onClick={() => setIsSecurityModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-[#001F3F] hover:bg-[#00172E] text-white font-bold text-sm sm:text-base transition-all border-0 cursor-pointer shadow-sm"
                    type="button"
                  >
                    {t("Tutup", "Close")}
                  </button>
                ) : (
                  <div className="flex gap-2.5 w-full justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingPassword(false);
                        setOldPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="px-6 py-3.5 bg-white border-2 border-gray-300 text-gray-800 font-bold rounded-xl hover:bg-gray-100 hover:text-black transition-all cursor-pointer shadow-sm text-center text-sm sm:text-base"
                    >
                      {t("Batal", "Cancel")}
                    </button>
                    <button 
                      onClick={() => {
                        if (!isGoogleUser && !oldPassword) {
                          toast.error(language === 'id' ? 'Kata sandi lama wajib diisi!' : 'Old password is required!');
                          return;
                        }
                        if (!newPassword) {
                          toast.error(language === 'id' ? 'Kata sandi baru wajib diisi!' : 'New password is required!');
                          return;
                        }
                        if (newPassword.length < 6) {
                          toast.error(language === 'id' ? 'Kata sandi baru minimal 6 karakter!' : 'New password must be at least 6 characters!');
                          return;
                        }
                        if (newPassword !== confirmPassword) {
                          toast.error(language === 'id' ? 'Konfirmasi kata sandi baru tidak cocok!' : 'New password confirmation does not match!');
                          return;
                        }

                        const targetEmail = localStorage.getItem('userEmail') || userEmail;
                        const targetUserId = localStorage.getItem('userId') || userId;

                        if (!targetEmail) {
                          toast.error(language === 'id' ? 'Sesi tidak valid atau email tidak terdeteksi. Silakan login ulang.' : 'Invalid session or email not detected. Please login again.');
                          return;
                        }

                        const loadToast = toast.loading(language === 'id' ? 'Menyimpan kata sandi...' : 'Saving password...');
                        fetch('/api/change-password', {
                          method: 'POST',
                          credentials: 'include',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                            email: targetEmail,
                            userId: targetUserId,
                            oldPassword: isGoogleUser ? '' : oldPassword,
                            newPassword
                          })
                        })
                        .then(async (res) => {
                          const data = await res.json();
                          toast.dismiss(loadToast);
                          if (!res.ok) {
                            toast.error(data.error || (language === 'id' ? 'Gagal mengubah kata sandi' : 'Failed to change password'));
                            return;
                          }
                          toast.success(language === 'id' ? 'Kata sandi berhasil diubah! 🎉' : 'Password successfully updated! 🎉');
                          
                          setOldPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                          setIsEditingPassword(false);
                          setIsSecurityModalOpen(false);
                        })
                        .catch((err) => {
                          toast.dismiss(loadToast);
                          toast.error(err.message || 'Error occurred');
                        });
                      }}
                      className="px-6 py-3.5 bg-[#001F3F] hover:bg-[#00172E] text-white font-bold text-sm sm:text-base rounded-xl transition-all border-0 cursor-pointer shadow-md flex-1 sm:flex-none text-center"
                      type="button"
                    >
                      {t("Simpan Kata Sandi", "Save Password")}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal Panduan Aplikasi */}
        {isGuideModalOpen && (
          <div className="security-modal-overlay">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="security-modal-backdrop"
              onClick={() => setIsGuideModalOpen(false)}
            />
            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
              className="security-modal-content"
            >
              {/* Header */}
              <div className="security-modal-header">
                <div className="flex items-center gap-2.5">
                  <div className="guide-modal-icon p-2 rounded-xl">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="security-modal-title text-lg sm:text-xl font-bold">
                      {t("Panduan Aplikasi MOODUIT", "MOODUIT App Guide")}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-0 mt-0.5">
                      {t("Kenali & manfaatkan seluruh fitur keuanganmu", "Discover & master your financial features")}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsGuideModalOpen(false)}
                  className="security-modal-close"
                  type="button"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="security-modal-body">
                <div className="security-section">
                  <h4 className="security-section-title text-base sm:text-lg font-bold">
                    ✨ {t("1. MOODUIT AI Advisor", "1. MOODUIT AI Advisor")}
                  </h4>
                  <p className="security-section-text text-sm sm:text-base leading-relaxed">
                    {t(
                      "Asisten keuangan pribadi Gen Z yang cerdas dan realistis. Kamu bisa berkonsultasi rencana belanja, mendapat teguran/roasting bijak jika pembelian terlalu konsumtif (>10% saldo), serta mencatat transaksi otomatis langsung via chat!",
                      "Your smart & realistic Gen Z financial advisor. Consult shopping plans, get realistic roasting/feedback if a purchase is too impulsive (>10% balance), and auto-record transactions directly via chat!"
                    )}
                  </p>
                </div>

                <div className="security-section">
                  <h4 className="security-section-title text-base sm:text-lg font-bold">
                    📸 {t("2. Scan Transaksi (OCR)", "2. Smart Receipt Scanner")}
                  </h4>
                  <p className="security-section-text text-sm sm:text-base leading-relaxed">
                    {t(
                      "Foto atau unggah foto struk belanjaanmu. AI secara otomatis membaca nama toko, tanggal, total nominal, dan rincian item barang tanpa perlu input manual.",
                      "Snap or upload receipt photos. AI automatically detects merchant name, date, total amount, and itemized list without manual typing."
                    )}
                  </p>
                </div>

                <div className="security-section">
                  <h4 className="security-section-title text-base sm:text-lg font-bold">
                    🧮 {t("3. Smart Budgeting (50/30/20)", "3. Smart Budgeting (50/30/20)")}
                  </h4>
                  <p className="security-section-text text-sm sm:text-base leading-relaxed">
                    {t(
                      "Bagi otomatis pendapatan bulananmu ke dalam 50% Kebutuhan Pokok, 30% Keinginan, dan 20% Tabungan/Investasi untuk menjaga alur keuangan sehat.",
                      "Automatically divide monthly income into 50% Needs, 30% Wants, and 20% Savings/Investments for a balanced financial life."
                    )}
                  </p>
                </div>

                <div className="security-section">
                  <h4 className="security-section-title text-base sm:text-lg font-bold">
                    🛡️ {t("4. Dana Darurat & Wishlist", "4. Emergency Fund & Wishlist")}
                  </h4>
                  <p className="security-section-text text-sm sm:text-base leading-relaxed">
                    {t(
                      "Hitung dan kumpulkan fondasi keamanan finansial 3-6 kali pengeluaran bulanan, serta wujudkan target barang impian secara terencana.",
                      "Calculate and build a 3-6 month safety net, and systematically track savings for your dream items."
                    )}
                  </p>
                </div>

                <div className="security-section">
                  <h4 className="security-section-title text-base sm:text-lg font-bold">
                    📊 {t("5. Analisa & Riwayat", "5. Analysis & History")}
                  </h4>
                  <p className="security-section-text text-sm sm:text-base leading-relaxed">
                    {t(
                      "Pantau grafik pengeluaran berdasarkan kategori dan cek seluruh riwayat catatan keuanganmu kapan saja.",
                      "Monitor expense charts by category and review all your financial logs anytime."
                    )}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="security-modal-footer">
                <button 
                  onClick={() => setIsGuideModalOpen(false)}
                  className="security-modal-btn text-sm sm:text-base font-bold"
                  type="button"
                >
                  {t("Paham, Terima Kasih!", "Got It, Thanks!")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
