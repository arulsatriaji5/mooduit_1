import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, List, Shield, Calculator, PieChart, Settings as SettingsIcon, LogOut, Plus, Camera, Keyboard, X, Scan, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Logo from './Logo';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { insertTransaction } from '../utils/api';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string, data?: any) => void;
  pendingData?: any;
  onClearPendingData?: () => void;
  key?: string;
  transactions?: any[];
  setTransactions?: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function Layout({ children, activePage, onNavigate, pendingData, onClearPendingData, transactions, setTransactions }: LayoutProps) {
  const { t } = useThemeLanguage();
  const [showActionModal, setShowActionModal] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualJenis, setManualJenis] = useState<'pemasukan' | 'pengeluaran'>('pengeluaran');
  const [manualTanggal, setManualTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [manualNominal, setManualNominal] = useState("");
  const [manualKategori, setManualKategori] = useState("Kebutuhan Pokok");
  const [manualCatatan, setManualCatatan] = useState("");
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);

  const kategoriPengeluaran = [
    { id: "Kebutuhan Pokok", icon: "🛒" },
    { id: "Transportasi", icon: "🚗" },
    { id: "Hiburan", icon: "🎬" },
    { id: "Makan & Minum", icon: "🍜" },
    { id: "Kesehatan", icon: "💊" },
    { id: "Pendidikan", icon: "📚" },
    { id: "Tagihan", icon: "📄" },
    { id: "Belanja", icon: "👕" },
    { id: "Lainnya", icon: "📦" }
  ];

  const kategoriPemasukan = [
    { id: "Gaji & Upah", icon: "💰" },
    { id: "Bonus & THR", icon: "🎉" },
    { id: "Hasil Usaha", icon: "🏪" },
    { id: "Investasi", icon: "📈" },
    { id: "Pemberian", icon: "🎁" },
    { id: "Lainnya", icon: "📦" }
  ];

  const kategoriAktif = manualJenis === "pengeluaran" ? kategoriPengeluaran : kategoriPemasukan;

  React.useEffect(() => {
    if (pendingData && pendingData.openManual) {
      setManualNominal(Number(pendingData.nominal).toLocaleString('id-ID'));
      setManualCatatan(pendingData.catatan || "");
      setManualKategori(pendingData.kategori || "Lainnya");
      setIsManualModalOpen(true);
      if (onClearPendingData) onClearPendingData();
    }
  }, [pendingData, onClearPendingData]);

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setManualNominal(rawValue ? Number(rawValue).toLocaleString('id-ID') : "");
  };

  const handleSaveManualTransaction = async () => {
    if (isSavingTransaction) return;

    const nominal = Number(manualNominal.replace(/\D/g, ""));
    if (!nominal || nominal <= 0) {
      toast.error(t('Masukkan nominal transaksi yang valid.', 'Enter a valid transaction amount.'));
      return;
    }

    const tempId = Date.now();
    const transactionType = manualJenis;
    const transactionCategory = manualKategori;
    const newTransaction = {
      id: tempId,
      nominal,
      catatan: manualCatatan || transactionCategory,
      kategori: transactionCategory,
      tanggal: manualTanggal,
      jenis: transactionType,
      icon: kategoriAktif.find(k => k.id === transactionCategory)?.icon || "🧾"
    };
    const userEmail = localStorage.getItem("userEmail") || "";

    setIsSavingTransaction(true);
    if (setTransactions) {
      setTransactions(prev => [newTransaction, ...prev]);
    }

    try {
      const inserted = await insertTransaction(newTransaction, userEmail);
      if (setTransactions) {
        setTransactions(prev => {
          const index = prev.findIndex(transaction => String(transaction.id) === String(tempId));
          if (index === -1) return prev;
          const next = [...prev];
          next[index] = inserted;
          return next;
        });
      }

      if (typeof window !== "undefined" && (window as any).triggerTransactionSuccess) {
        (window as any).triggerTransactionSuccess(inserted.currentStreak, inserted.streakIncreasedToday, {
          type: inserted.type || transactionType,
          amount: inserted.amount || nominal,
          category: inserted.category || transactionCategory
        });
      }

      setIsManualModalOpen(false);
      setManualNominal("");
      setManualCatatan("");
      onNavigate('dashboard');
    } catch (error) {
      console.error("Failed to insert manual transaction:", error);
      if (setTransactions) {
        setTransactions(prev => prev.filter(transaction => String(transaction.id) !== String(tempId)));
      }
      toast.error(t('Transaksi gagal disimpan. Silakan coba lagi.', 'The transaction could not be saved. Please try again.'));
    } finally {
      setIsSavingTransaction(false);
    }
  };

  const navItems = [
    { id: 'dashboard', icon: <Home size={22} className="shrink-0" />, label: t('Beranda', 'Home') },
    { id: 'smart-budget', icon: <Calculator size={22} className="shrink-0" />, label: t('Smart Budget', 'Smart Budget') },
    { id: 'scanner', icon: <Camera size={24} strokeWidth={2} className="shrink-0 text-[#112F58]" />, label: t('Scan', 'Scan'), isAction: true },
    { id: 'analisa', icon: <PieChart size={22} className="shrink-0" />, label: t('Analisa', 'Analysis') },
    { id: 'history', icon: <List size={22} className="shrink-0" />, label: t('Riwayat', 'History') },
    { id: 'settings', icon: <SettingsIcon size={22} className="shrink-0" />, label: t('Pengaturan', 'Settings') },
  ];

  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('userName') || 'Arul Satriaji';
  });

  const [userAvatar, setUserAvatar] = useState(() => {
    const email = localStorage.getItem('userEmail');
    const savedLocalAvatar = email ? localStorage.getItem(`avatar_${email}`) : null;
    return localStorage.getItem('userAvatar') || savedLocalAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=Arul`;
  });

  React.useEffect(() => {
    const handleProfileChange = () => {
      const updatedName = localStorage.getItem('userName') || 'Arul Satriaji';
      const email = localStorage.getItem('userEmail');
      const savedLocalAvatar = email ? localStorage.getItem(`avatar_${email}`) : null;
      setUserName(updatedName);
      setUserAvatar(localStorage.getItem('userAvatar') || savedLocalAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=Arul`);
    };
    window.addEventListener('avatarChanged', handleProfileChange);
    window.addEventListener('profileUpdated', handleProfileChange);
    return () => {
      window.removeEventListener('avatarChanged', handleProfileChange);
      window.removeEventListener('profileUpdated', handleProfileChange);
    };
  }, []);

  return (
    <div className="app-shell min-h-screen bg-bg-light overflow-x-hidden w-full max-w-full box-border">
      <div className="d-flex h-100 overflow-hidden w-full max-w-full box-border">
        {/* Desktop Sidebar */}
        <aside className="app-sidebar sidebar-mooduit d-none d-lg-flex flex-column position-fixed h-100" style={{ zIndex: 1100, backgroundColor: '#112F58' }}>
          <div className="p-4">
            <Logo size={40} showText={true} variant="light" />
          </div>

          <nav className="flex-grow-1 px-3">
            {navItems.map((item) => {
              if (item.id === 'scanner') {
                return (
                  <button 
                    key={item.id}
                    onClick={() => setShowActionModal(true)}
                    style={{ backgroundColor: '#B9AB8C', color: '#112F58' }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all shadow-sm group border-0 mb-2 cursor-pointer"
                  >
                    <span className="flex items-center justify-center shrink-0">
                      {item.icon}
                    </span>
                    <span className="font-bold whitespace-nowrap overflow-hidden text-ellipsis text-sm">{item.label}</span>
                  </button>
                );
              }
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`border-0 w-100 text-start px-3 py-2.5 mb-2 rounded-xl transition-all d-flex align-items-center gap-3 cursor-pointer ${
                    activePage === item.id 
                      ? 'active bg-white bg-opacity-10' 
                      : 'text-white opacity-70 hover:opacity-100'
                  }`}
                  style={{ 
                    backgroundColor: 'transparent',
                    color: 'inherit'
                  }}
                >
                  <span className="flex items-center justify-center shrink-0">
                    {item.icon}
                  </span>
                  <span className="small fw-bold whitespace-nowrap overflow-hidden text-ellipsis">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="nav-footer mt-auto p-4 border-top border-white border-opacity-10 d-flex align-items-center gap-3">
            <div className="rounded-circle border-2 border-white border-opacity-20 overflow-hidden" style={{ width: '40px', height: '40px' }}>
              <img src={userAvatar} alt="Avatar" className="w-100 h-100" />
            </div>
            <div className="flex-grow-1 overflow-hidden">
               <div className="text-white text-sm fw-bold text-truncate">{userName}</div>
               <div className="text-white opacity-60 text-xs">{t('Pengguna Aktif', 'Active User')}</div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="app-content flex-grow-1 w-full overflow-x-hidden max-w-full box-border">
          {/* Mobile Header */}
          <div className="app-mobile-header d-lg-none bg-primary-mooduit position-sticky top-0 w-100 d-flex justify-content-between align-items-center shadow-sm" style={{ zIndex: 1000 }}>
            <Logo size={32} showText={true} variant="light" />
            <div 
              onClick={() => onNavigate('settings')}
              className="p-1 cursor-pointer transition-transform active:scale-95 flex items-center justify-center rounded-full"
              title="Buka Pengaturan"
              id="header_profile_btn"
            >
              {userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt="Profile" 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-transparent hover:border-blue-200 shadow-sm transition-all" 
                />
              ) : (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-100 text-[#001F3F] font-bold flex items-center justify-center shadow-sm border border-blue-200 text-sm">
                  {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
          </div>
          
          <main className="app-main w-full max-w-full overflow-x-hidden box-border">
            <div className="app-content-container mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="app-bottom-nav fixed-bottom bg-white dark:bg-slate-800 d-lg-none px-2 py-1 shadow-2xl transition-colors" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', zIndex: 1050 }}>
        <div className="container-fluid d-flex justify-content-around align-items-center h-100 p-0">
          {navItems.filter(item => item.id !== 'settings').map((item) => {
            const isScanner = item.id === 'scanner';
            if (isScanner) {
              return (
                <div 
                  key={item.id}
                  onClick={() => setShowActionModal(true)}
                  className="flex flex-col items-center justify-center rounded-full text-[#112F58] shadow-lg border-4 border-white dark:border-slate-900 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  style={{ width: '60px', height: '60px', backgroundColor: '#B9AB8C', marginTop: '-24px', flexShrink: 0 }}
                  role="button"
                  tabIndex={0}
                  aria-label="Scan"
                >
                  <Camera size={24} strokeWidth={2} className="text-[#112F58]" />
                  <span style={{ fontSize: '10px', fontWeight: '800', marginTop: '2px', lineHeight: '1', color: '#112F58' }}>
                    Scan
                  </span>
                </div>
              );
            }

            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 border-0 bg-transparent cursor-pointer transition-all outline-none ${
                  isActive 
                    ? 'text-primary-mooduit dark:text-sky-400' 
                    : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="mb-0.5 flex items-center justify-center">
                  {item.icon}
                </div>
                <span className="app-bottom-nav-label">
                  {item.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="bg-primary-mooduit dark:bg-sky-400 rounded-full mt-1" 
                    style={{ width: '4px', height: '4px' }} 
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
      
      {/* Action Modal (Catat Transaksi) */}
      <AnimatePresence>
        {showActionModal && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 2000 }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="position-absolute top-0 start-0 w-100 h-100 bg-black bg-opacity-50"
              onClick={() => setShowActionModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-4 shadow-2xl position-relative overflow-hidden"
              style={{ width: '90%', maxWidth: '360px' }}
            >
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-800 text-primary-mooduit text-xl md:text-2xl mb-0">{t('Catat Transaksi', 'Record Transaction')}</h2>
                <button className="btn btn-light rounded-circle p-1 cursor-pointer" onClick={() => setShowActionModal(false)}><X size={20}/></button>
              </div>

              <div className="d-flex flex-column">
                <button 
                  type="button"
                  className="group w-full min-w-0 flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-[#112F58] hover:bg-[#0c2240] active:bg-[#08172b] active:scale-95 transition-all duration-200 mb-3 focus:outline-none shadow-sm cursor-pointer overflow-hidden"
                  onClick={() => {
                    setShowActionModal(false);
                    onNavigate('scanner');
                  }}
                >
                  <div className="w-12 h-12 rounded-full flex shrink-0 items-center justify-center bg-blue-500 text-white shadow-sm">
                    <Camera size={24} />
                  </div>
                  <div className="text-start min-w-0 flex-1 overflow-hidden">
                    <h3 className="font-bold text-white mb-0 text-base md:text-lg leading-tight">{t('Scan Struk', 'Scan Receipt')}</h3>
                    <p
                      className="w-full max-w-full text-[11px] sm:text-sm text-blue-100 opacity-85 mb-0 leading-snug"
                      style={{ whiteSpace: 'normal', overflowWrap: 'anywhere' }}
                    >
                      {t('Foto nota atau screenshot mutasi', 'Photograph receipt or transaction screenshot')}
                    </p>
                  </div>
                </button>

                <button 
                  type="button"
                  className="group w-full min-w-0 flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-[#112F58] hover:bg-[#0c2240] active:bg-[#08172b] active:scale-95 transition-all duration-200 mb-2 focus:outline-none shadow-sm cursor-pointer overflow-hidden"
                  onClick={() => {
                    setShowActionModal(false);
                    setIsManualModalOpen(true);
                  }}
                >
                  <div className="w-12 h-12 rounded-full flex shrink-0 items-center justify-center bg-teal-500 text-white shadow-sm">
                    <Keyboard size={24} />
                  </div>
                  <div className="text-start min-w-0 flex-1 overflow-hidden">
                    <h3 className="font-bold text-white mb-0 text-base md:text-lg leading-tight">{t('Input Manual', 'Manual Input')}</h3>
                    <p
                      className="w-full max-w-full text-[11px] sm:text-sm text-blue-100 opacity-85 mb-0 leading-snug"
                      style={{ whiteSpace: 'normal', overflowWrap: 'anywhere' }}
                    >
                      {t('Masukkan data secara detail', 'Enter detailed data')}
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Input Modal (Tambah Transaksi) */}
      <AnimatePresence>
        {isManualModalOpen && (
          <div className="fixed inset-0 z-[2100] flex items-end sm:items-center justify-center bg-[#112F58]/40 backdrop-blur-sm p-0 sm:p-4 transition-all duration-300">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#112F58]/20"
              onClick={() => {
                if (!isSavingTransaction) setIsManualModalOpen(false);
              }}
            />
            
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative z-10 max-h-[90vh]"
            >
              {/* HEADER */}
              <div className="p-4 sm:p-6 pb-3 flex justify-between items-center border-b border-gray-100">
                <h2 className="text-[#112F58] text-xl sm:text-2xl font-extrabold tracking-wide m-0">{t('Tambah Transaksi', 'Add Transaction')}</h2>
                <button 
                  onClick={() => {
                    if (!isSavingTransaction) setIsManualModalOpen(false);
                  }}
                  disabled={isSavingTransaction}
                  className="bg-gray-50 p-1.5 sm:p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-all focus:outline-none border-0 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* KONTEN (Scrollable) */}
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                
                {/* TOGGLE PENGELUARAN / PEMASUKAN */}
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-bold uppercase tracking-wider block mb-1.5 px-1 font-sans">
                    Jenis Transaksi
                  </label>
                  <div className="flex w-full bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-sm">
                    <button 
                      type="button"
                      onClick={() => {
                        setManualJenis("pengeluaran");
                        setManualKategori("Kebutuhan Pokok");
                      }}
                      className={`flex-1 py-3 sm:py-3.5 text-xs sm:text-sm font-bold transition-all duration-200 border-0 cursor-pointer rounded-l-xl rounded-r-none border-r border-slate-200 dark:border-slate-700 ${
                        manualJenis === "pengeluaran" 
                          ? "bg-[#112F58] text-white" 
                          : "bg-white text-slate-500 hover:bg-[#112F58] hover:text-white dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {t('Pengeluaran', 'Expenses')}
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setManualJenis("pemasukan");
                        setManualKategori("Gaji & Upah");
                      }}
                      className={`flex-1 py-3 sm:py-3.5 text-xs sm:text-sm font-bold transition-all duration-200 border-0 cursor-pointer rounded-r-xl rounded-l-none ${
                        manualJenis === "pemasukan" 
                          ? "bg-[#112F58] text-white" 
                          : "bg-white text-slate-500 hover:bg-[#112F58] hover:text-white dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {t('Pemasukan', 'Income')}
                    </button>
                  </div>
                </div>

                {/* INPUT NOMINAL BESAR */}
                <div>
                  <label className="text-gray-500 text-xs sm:text-sm font-bold uppercase tracking-wider mb-1 sm:mb-2 block px-1">{t('Jumlah Nominal', 'Total Nominal')}</label>
                  <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden focus-within:border-[#112F58] focus-within:bg-white transition-all duration-300">
                    <span className={`pl-4 sm:pl-5 text-xl sm:text-2xl font-bold ${manualJenis === "pengeluaran" ? "text-red-500" : "text-emerald-500"}`}>Rp</span>
                    <input 
                      type="text" 
                      value={manualNominal} 
                      onChange={handleNominalChange} 
                      placeholder="0" 
                      className={`w-full bg-transparent py-3 sm:py-5 pl-2 sm:pl-3 pr-4 sm:pr-5 text-2xl sm:text-4xl font-extrabold focus:outline-none placeholder-gray-300 ${manualJenis === "pengeluaran" ? "text-red-500" : "text-emerald-500"}`} 
                    />
                  </div>
                </div>

                {/* GRID KATEGORI */}
                <div>
                  <label className="text-gray-500 text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-3 block px-1">{t('Pilih Kategori', 'Select Category')}</label>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-3 group-kategori">
                    {kategoriAktif.map((kat) => (
                      <button 
                        key={kat.id}
                        type="button"
                        aria-pressed={manualKategori === kat.id}
                        onClick={() => setManualKategori(kat.id)}
                        className={`min-w-0 min-h-[76px] overflow-hidden flex flex-col items-center justify-center gap-1 px-1.5 py-2 sm:p-3.5 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 cursor-pointer group ${
                          manualKategori === kat.id 
                            ? "bg-[#112f58] border-[#112f58] text-white shadow-md scale-[1.02]" 
                            : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:bg-[#112f58] hover:border-[#112f58] dark:hover:bg-slate-700 dark:hover:border-slate-700 hover:text-white dark:hover:text-white"
                        }`}
                      >
                        <span className="text-lg sm:text-2xl leading-none drop-shadow-sm">{kat.icon}</span>
                        <span
                          className={`w-full min-w-0 px-0.5 text-[9px] min-[375px]:text-[10px] sm:text-xs text-center font-bold leading-[1.15] whitespace-normal transition-colors ${
                          manualKategori === kat.id ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-white dark:group-hover:text-white'
                          }`}
                        >
                          {kat.id === 'Kebutuhan Pokok' ? (
                            <>
                              <span className="block whitespace-nowrap">Kebutuhan</span>
                              <span className="block whitespace-nowrap">Pokok</span>
                            </>
                          ) : kat.id}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* TANGGAL & CATATAN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-gray-500 text-xs sm:text-sm font-bold uppercase tracking-wider mb-1 sm:mb-2 block px-1">{t('Tanggal', 'Date')}</label>
                    <input 
                      type="date" 
                      value={manualTanggal} 
                      onChange={(e) => setManualTanggal(e.target.value)} 
                      className="w-full bg-gray-50 text-gray-700 border border-gray-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3.5 text-xs sm:text-sm focus:border-[#112F58] focus:bg-white focus:outline-none transition-all cursor-pointer" 
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs sm:text-sm font-bold uppercase tracking-wider mb-1 sm:mb-2 block px-1">{t('Catatan', 'Notes')}</label>
                    <input 
                      type="text" 
                      value={manualCatatan} 
                      onChange={(e) => setManualCatatan(e.target.value)} 
                      placeholder={manualJenis === 'pemasukan'
                        ? t('Misal: Gaji bulan ini...', 'E.g., Monthly salary...')
                        : t('Misal: Makan siang...', 'E.g., Lunch...')} 
                      className="w-full bg-gray-50 text-gray-700 border border-gray-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3.5 text-xs sm:text-sm focus:border-[#112F58] focus:bg-white focus:outline-none transition-all placeholder-gray-400" 
                    />
                  </div>
                </div>
              </div>

              {/* TOMBOL SIMPAN */}
              <div className="p-4 sm:p-6 pt-1 sm:pt-2 bg-white">
                <button 
                  className="w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-[#112F58] text-white font-bold text-base sm:text-lg shadow-lg hover:bg-[#0c2240] active:scale-95 transition-all flex items-center justify-center gap-2 border-0 cursor-pointer"
                  onClick={handleSaveManualTransaction}
                  disabled={isSavingTransaction || !manualNominal}
                  aria-busy={isSavingTransaction}
                >
                  {isSavingTransaction ? (
                    <Loader2 size={22} className="animate-spin" />
                  ) : (
                    <Plus size={24} strokeWidth={3} />
                  )}
                  <span>{isSavingTransaction ? t('Menyimpan transaksi...', 'Saving transaction...') : t('Simpan Transaksi', 'Save Transaction')}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
